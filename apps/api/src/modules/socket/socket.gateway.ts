import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TASK_QUEUE_REPOSITORY, TENANT_REPOSITORY } from 'src/constants/database.const';
import { TaskQueue } from 'src/database/models/task-queue.model';
import { Tenant } from 'src/database/models/tenant.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { IAccessTokenPayload } from 'src/types/access-token.type';
import { AppLoggerService } from '../logger/logger.service';
import { TokenProvider } from '../utility/token.provider';
import { ConnectionSubscribeEventData } from './types/connection-event.type';
import { ConnectionTaskAcceptData, ConnectionTaskDoneData, ConnectionTaskRejectData, DispatchTaskData } from './types/connection-task.type';
import { SocketAuthContext, SocketConnection, SocketConnectionType } from './types/socket-connection.type';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  private connections: Map<string, SocketConnection> = new Map();
  private events: Map<string, Set<string>> = new Map();

  constructor(
    private readonly logger: AppLoggerService,
    private readonly tokenProvider: TokenProvider,
    private readonly configService: ConfigService,
    private readonly postgresProvider: PostgresProvider,
    @Inject(TENANT_REPOSITORY) private readonly tenantRepository: typeof Tenant,
    @Inject(TASK_QUEUE_REPOSITORY) private readonly taskQueueRepository: typeof TaskQueue
  ) {}

  afterInit(server: Server) {
    server.use(async (socket, next) => {
      const conn = this.connections.get(socket.id);
      if (conn) {
        return next();
      }

      const token = socket.handshake.auth.token;
      const name = socket.handshake.query.connection_name as string;
      const type = socket.handshake.query.connection_type as SocketConnectionType;

      if (!token && !name && !type) {
        const err = new Error('ValidationError');
        (err as any).data = {
          type: 'ValidationError',
          message: 'Auth token & query param missing',
        };
        return next(err);
      }

      const tokenPayload = this.tokenProvider.decodeJwt<IAccessTokenPayload>(token);

      let tenant: Tenant | null = null;
      const transaction = await this.postgresProvider.transaction();
      try {
        await this.postgresProvider.setSchema('master', transaction);
        tenant = await this.tenantRepository.findOne({
          where: { id: tokenPayload.tenant_id },
          transaction,
        });
        if (!tenant) {
          throw new Error('Tenant not found in database!');
        }
        await transaction.commit();
      }
      catch (error) {
        this.logger.error(
          `Get Tenant from DB Error: ${(error as Error).message}`,
          (error as Error).stack,
          'WebsocketConnect',
        );
        await transaction.rollback();
        const err = new Error('InternalServerError');
        (err as any).data = {
          type: 'InternalServerError',
          message: 'Something wrong in server',
        };
        return next(err);
      }

      try {
        const payload = await this.tokenProvider.verifyJwt<IAccessTokenPayload>(
          this.configService.get<string>('token.secret')!,
          token,
        );

        socket.data.authContext = {
          tenant_id: payload.tenant_id,
          name,
          type,
        };

        return next();
      }
      catch {
        const err = new Error('InvalidTokenError');
        (err as any).data = {
          type: 'InvalidTokenError',
          message: 'Token invalid',
        };
        return next(err);
      }
    });
  }

  async handleConnection(client: Socket) {
    const authContext = client.data.authContext as SocketAuthContext;

    this.connections.set(client.id, {
      socket: client,
      name: authContext.name,
      type: authContext.type,
      tenant_id: authContext.tenant_id,
      inflight: 0,
      connectedAt: Date.now(),
    });
  }

  handleDisconnect(client: Socket) {
    this.connections.delete(client.id);
  }

  @SubscribeMessage('task-accept')
  async handleTaskAccepted(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: ConnectionTaskAcceptData
  ) {
    const conn = this.connections.get(client.id);
    if (!conn) {
      return;
    }

    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema('master', transaction);
      await this.taskQueueRepository.update(
        { status: 'DISPATCHED' },
        {
          where: {
            id: data.taskId,
          },
          transaction,
        }
      );
      await transaction.commit();
      conn.inflight += 1;
    }
    catch (e) {
      this.logger.error(
        `Update task ${data.taskId} status to DISPATCHED error`,
        (e as Error).stack,
        'TaskDispatch'
      );
      await transaction.rollback();
    }
  }

  @SubscribeMessage('task-reject')
  async handleTaskRejected(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: ConnectionTaskRejectData
  ) {
    const conn = this.connections.get(client.id);
    if (!conn) {
      return;
    }

    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema('master', transaction);
      await this.taskQueueRepository.update(
        { status: 'FAILED', error_message: data.message },
        {
          where: {
            id: data.taskId,
          },
          transaction,
        }
      );
      await transaction.commit();
      conn.inflight -= conn.inflight === 0 ? 0 : 1;
    }
    catch (e) {
      this.logger.error(
        `Update task ${data.taskId} status reject error`,
        (e as Error).stack,
        'TaskReject'
      );
      await transaction.rollback();
    }
  }

  @SubscribeMessage('task-done')
  async handleTaskDone(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: ConnectionTaskDoneData
  ) {
    const conn = this.connections.get(client.id);
    if (!conn) {
      return;
    }

    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema('master', transaction);
      await this.taskQueueRepository.update(
        { status: data.status, error_message: data.message },
        {
          where: {
            id: data.taskId,
          },
          transaction,
        }
      );
      await transaction.commit();
      conn.inflight -= conn.inflight === 0 ? 0 : 1;
    }
    catch (e) {
      this.logger.error(
        `Update task ${data.taskId} status done error`,
        (e as Error).stack,
        'TaskDone'
      );
      await transaction.rollback();
    }
  }

  @SubscribeMessage('subscribe-event')
  async handleEventSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: ConnectionSubscribeEventData
  ) {
    if (!data.eventName) {
      client.emit('subscribe-event-error', {
        message: 'eventName in body required',
      });
      return;
    }
    return this.subscribeClientToEvent(client.id, data.eventName);
  }

  @SubscribeMessage('unsubscribe-event')
  async handleEventUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: ConnectionSubscribeEventData
  ) {
    if (!data.eventName) {
      client.emit('unsubscribe-event-error', {
        message: 'eventName in body required',
      });
      return;
    }
    return this.unsubscribeClientToEvent(client.id, data.eventName);
  }

  async dispatchTask(
    taskId: string,
    tenantId: string,
    dispatchTaskData?: DispatchTaskData
  ) {
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
      return undefined;
    }

    availableBot.socket.emit('task-dispatch', { taskId, ...dispatchTaskData });
    return availableBot.socket.id;
  }

  async sendEvent(eventName: string, payload: any) {
    const event = this.events.get(eventName);
    if (!event) {
      return;
    }

    event.forEach((clientId) => {
      const conn = this.connections.get(clientId);
      if (!conn) {
        return;
      }

      conn.socket.emit('event', { eventName, payload });
    });
  }

  subscribeClientToEvent(clientId: string, eventName: string) {
    let event = this.events.get(eventName);
    if (!event) {
      this.events.set(eventName, new Set());
      event = this.events.get(eventName);
    }

    event!.add(clientId);
  }

  unsubscribeClientToEvent(clientId: string, eventName: string) {
    const event = this.events.get(eventName);
    if (!event) {
      return;
    }

    event.delete(clientId);
  }

  getConnection(clientId: string) {
    const conn = this.connections.get(clientId);
    if (!conn) {
      return undefined;
    }

    return {
      name: conn.name,
      type: conn.type,
      tenant_id: conn.tenant_id,
      inflight: conn.inflight,
      connectedAt: conn.connectedAt,
    };
  }

  private getAvailableBot(tenantId: string) {
    const candidates = Array.from(this.connections.values()).filter(
      c => c.tenant_id === tenantId && c.type === 'BOT',
    );
    if (!candidates.length)
      return undefined;
    if (candidates.length === 1)
      return candidates[0];

    candidates.sort((a, b) => {
      if (a.inflight !== b.inflight)
        return a.inflight - b.inflight;
      return a.connectedAt - b.connectedAt;
    });

    return candidates[0];
  }
}
