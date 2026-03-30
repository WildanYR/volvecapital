import type { Socket } from 'socket.io';
import { Inject, Injectable } from '@nestjs/common';
import { TASK_QUEUE_REPOSITORY, TENANT_REPOSITORY } from 'src/constants/database.const';
import { TaskQueue } from 'src/database/models/task-queue.model';
import { Tenant } from 'src/database/models/tenant.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { IAccessTokenPayload } from 'src/types/access-token.type';
import { AppLoggerService } from '../logger/logger.service';
import { TokenProvider } from '../utility/token.provider';
import { ConnectionTaskDoneData, DispatchTaskData, EventData } from './types/connection-task.type';
import { SocketAuthContext, SocketConnectionSummary, SocketConnectionType } from './types/socket-connection.type';

interface SocketConnection {
  socket: Socket;
  name: string;
  tenant_id: string;
  type: SocketConnectionType;
  inflight: number;
  connectedAt: number;
}

@Injectable()
export class SocketService {
  private connections: Map<string, SocketConnection> = new Map();
  private events: Map<string, Set<string>> = new Map();

  constructor(
    private readonly logger: AppLoggerService,
    private readonly tokenProvider: TokenProvider,
    private readonly postgresProvider: PostgresProvider,
    @Inject(TENANT_REPOSITORY) private readonly tenantRepository: typeof Tenant,
    @Inject(TASK_QUEUE_REPOSITORY) private readonly taskQueueRepository: typeof TaskQueue,
  ) {}

  async authenticateSocket(token: string, name: string, type: SocketConnectionType): Promise<SocketAuthContext> {
    if (!token || !name || !type) {
      const err = new Error('ValidationError');
      (err as Error & { data?: object }).data = {
        type: 'ValidationError',
        message: 'Auth token & query param missing',
      };
      throw err;
    }

    const tokenPayload = this.tokenProvider.decodeJwt<IAccessTokenPayload>(token);

    const transaction = await this.postgresProvider.transaction();

    try {
      await this.postgresProvider.setSchema('master', transaction);
      const tenant = await this.tenantRepository.findOne({
        where: { id: tokenPayload.tenant_id },
        transaction,
      });

      if (!tenant) {
        throw new Error('Tenant not found in database!');
      }

      await this.tokenProvider.verifyJwt<IAccessTokenPayload>(
        tenant.dataValues.secret,
        token,
      );

      await transaction.commit();
    }
    catch (error) {
      const isJwtError = error instanceof Error
        && ['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(error.name);

      if (isJwtError) {
        await transaction.rollback();
        const err = new Error('InvalidTokenError');
        (err as Error & { data?: object }).data = {
          type: 'InvalidTokenError',
          message: 'Token invalid',
        };
        throw err;
      }

      this.logger.error(
        `Get Tenant from DB Error: ${(error as Error).message}`,
        (error as Error).stack,
        'WebsocketConnect',
      );
      await transaction.rollback();

      const err = new Error('InternalServerError');
      (err as Error & { data?: object }).data = {
        type: 'InternalServerError',
        message: 'Something wrong in server',
      };
      throw err;
    }

    return {
      tenant_id: tokenPayload.tenant_id,
      name,
      type,
    };
  }

  registerConnection(client: Socket, authContext: SocketAuthContext) {
    this.connections.set(client.id, {
      socket: client,
      name: authContext.name,
      type: authContext.type,
      tenant_id: authContext.tenant_id,
      inflight: 0,
      connectedAt: Date.now(),
    });
  }

  removeConnection(clientId: string) {
    this.connections.delete(clientId);

    for (const event of this.events.values()) {
      event.delete(clientId);
    }
  }

  async handleTaskAccepted(clientId: string, taskId: string) {
    const conn = this.connections.get(clientId);
    if (!conn) {
      return;
    }

    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema('master', transaction);
      await this.taskQueueRepository.update(
        { status: 'DISPATCHED' },
        { where: { id: taskId }, transaction },
      );
      await transaction.commit();
      conn.inflight += 1;
    }
    catch (error) {
      this.logger.error(
        `Update task ${taskId} status to DISPATCHED error`,
        (error as Error).stack,
        'TaskDispatch',
      );
      await transaction.rollback();
    }
  }

  async handleTaskRejected(clientId: string, taskId: string, message: string) {
    const conn = this.connections.get(clientId);
    if (!conn) {
      return;
    }

    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema('master', transaction);
      await this.taskQueueRepository.update(
        { status: 'FAILED', error_message: message },
        { where: { id: taskId }, transaction },
      );
      await transaction.commit();
      conn.inflight -= conn.inflight === 0 ? 0 : 1;
    }
    catch (error) {
      this.logger.error(
        `Update task ${taskId} status reject error`,
        (error as Error).stack,
        'TaskReject',
      );
      await transaction.rollback();
    }
  }

  async handleTaskDone(clientId: string, data: ConnectionTaskDoneData) {
    const conn = this.connections.get(clientId);
    if (!conn) {
      return;
    }

    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema('master', transaction);
      await this.taskQueueRepository.update(
        { status: data.status, error_message: data.message },
        { where: { id: data.taskId }, transaction },
      );
      await transaction.commit();
      conn.inflight -= conn.inflight === 0 ? 0 : 1;
    }
    catch (error) {
      this.logger.error(
        `Update task ${data.taskId} status done error`,
        (error as Error).stack,
        'TaskDone',
      );
      await transaction.rollback();
    }
  }

  async dispatchTask(taskId: string, tenantId: string, dispatchTaskData?: Omit<DispatchTaskData, 'taskId'>) {
    const availableBot = this.getAvailableBot(tenantId);
    if (!availableBot) {
      const transaction = await this.postgresProvider.transaction();
      try {
        await this.postgresProvider.setSchema('master', transaction);
        await this.taskQueueRepository.update(
          {
            status: 'FAILED',
            error_message: 'no bot available to handle the task',
          },
          { where: { id: taskId }, transaction },
        );
        await transaction.commit();
      }
      catch {
        await transaction.rollback();
      }

      return null;
    }

    availableBot.socket.emit('task-dispatch', { taskId, ...dispatchTaskData } satisfies DispatchTaskData);
    return availableBot.socket.id;
  }

  sendEvent(eventName: string, payload: EventData['payload']) {
    const event = this.events.get(eventName);
    if (!event) {
      return;
    }

    event.forEach((clientId) => {
      const conn = this.connections.get(clientId);
      if (!conn) {
        return;
      }

      conn.socket.emit('event', { eventName, payload } satisfies EventData);
    });
  }

  subscribeClientToEvent(clientId: string, eventName: string) {
    let event = this.events.get(eventName);
    if (!event) {
      event = new Set<string>();
      this.events.set(eventName, event);
    }

    event.add(clientId);
  }

  unsubscribeClientToEvent(clientId: string, eventName: string) {
    const event = this.events.get(eventName);
    if (!event) {
      return;
    }

    event.delete(clientId);
  }

  getConnection(clientId: string): SocketConnectionSummary | null {
    const conn = this.connections.get(clientId);
    if (!conn) {
      return null;
    }

    return {
      id: conn.socket.id,
      name: conn.name,
      tenant_id: conn.tenant_id,
      type: conn.type,
      inflight: conn.inflight,
      connectedAt: conn.connectedAt,
    };
  }

  private getAvailableBot(tenantId: string) {
    const candidates = Array.from(this.connections.values()).filter(
      c => c.tenant_id === tenantId && c.type === 'BOT',
    );

    if (!candidates.length) {
      return undefined;
    }

    if (candidates.length === 1) {
      return candidates[0];
    }

    candidates.sort((a, b) => {
      if (a.inflight !== b.inflight) {
        return a.inflight - b.inflight;
      }

      return a.connectedAt - b.connectedAt;
    });

    return candidates[0];
  }
}
