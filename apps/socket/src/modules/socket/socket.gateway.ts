import type { IncomingMessage } from 'node:http';
import * as crypto from 'node:crypto';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { AppLoggerService } from '../logger/logger.service';
import { SocketService } from './socket.service';
import { ConnectionSubscribeEventData } from './types/connection-event.type';
import { ConnectionTaskAcceptData, ConnectionTaskDoneData, ConnectionTaskRejectData } from './types/connection-task.type';
import { CustomWebSocket } from './types/custom-websocket.type';
import { SocketConnectionType } from './types/socket-connection.type';

@WebSocketGateway()
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly socketService: SocketService,
    private readonly logger: AppLoggerService,
  ) {}

  async handleConnection(client: CustomWebSocket, request: IncomingMessage) {
    this.logger.log(`New connection attempt from IP: ${request.socket.remoteAddress}, URL: ${request.url}`, 'SocketGateway');
    try {
      client.id = crypto.randomUUID();

      const url = new URL(request.url || '', 'http://localhost');
      const token = url.searchParams.get('token') || '';
      const name = url.searchParams.get('connection_name') || '';
      const type = url.searchParams.get('connection_type') as SocketConnectionType;

      const authContext = await this.socketService.authenticateSocket(token, name, type);
      client.authContext = authContext;

      this.socketService.registerConnection(client, authContext);

      this.logger.log(`Connection authenticated successfully: id=${client.id}, name=${name}, type=${type}`, 'SocketGateway');

      client.send(JSON.stringify({
        event: 'connected',
        data: { id: client.id },
      }));
    }
    catch (error: any) {
      const errorData = error.data || {
        type: 'ValidationError',
        message: error.message || 'Authentication failed',
      };

      this.logger.error(
        `Connection authentication failed: ${error.message || error}`,
        error.stack,
        'SocketGateway',
      );

      try {
        client.send(JSON.stringify({
          event: 'connect_error',
          data: errorData,
        }));
        client.close(4000, errorData.message);
      }
      catch (closeError: any) {
        this.logger.error(
          `Failed to close client socket cleanly: ${closeError.message}`,
          closeError.stack,
          'SocketGateway',
        );
      }
    }
  }

  handleDisconnect(client: CustomWebSocket) {
    this.logger.log(`Client disconnected: id=${client.id || 'unknown'}`, 'SocketGateway');
    this.socketService.removeConnection(client.id);
  }

  @SubscribeMessage('task-accept')
  async handleTaskAccepted(@ConnectedSocket() client: CustomWebSocket, @MessageBody() data: ConnectionTaskAcceptData) {
    await this.socketService.handleTaskAccepted(client.id, data.taskId);
  }

  @SubscribeMessage('task-reject')
  async handleTaskRejected(@ConnectedSocket() client: CustomWebSocket, @MessageBody() data: ConnectionTaskRejectData) {
    await this.socketService.handleTaskRejected(client.id, data.taskId, data.message);
  }

  @SubscribeMessage('task-done')
  async handleTaskDone(@ConnectedSocket() client: CustomWebSocket, @MessageBody() data: ConnectionTaskDoneData) {
    await this.socketService.handleTaskDone(client.id, data);
  }

  @SubscribeMessage('subscribe-event')
  handleEventSubscribe(@ConnectedSocket() client: CustomWebSocket, @MessageBody() data: ConnectionSubscribeEventData) {
    if (!data.eventName) {
      client.send(JSON.stringify({
        event: 'subscribe-event-error',
        data: {
          message: 'eventName in body required',
        },
      }));
      return;
    }

    this.socketService.subscribeClientToEvent(client.id, data.eventName);
  }

  @SubscribeMessage('unsubscribe-event')
  handleEventUnsubscribe(@ConnectedSocket() client: CustomWebSocket, @MessageBody() data: ConnectionSubscribeEventData) {
    if (!data.eventName) {
      client.send(JSON.stringify({
        event: 'unsubscribe-event-error',
        data: {
          message: 'eventName in body required',
        },
      }));
      return;
    }

    this.socketService.unsubscribeClientToEvent(client.id, data.eventName);
  }
}
