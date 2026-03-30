import type { Server, Socket } from 'socket.io';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { SocketService } from './socket.service';
import { ConnectionSubscribeEventData } from './types/connection-event.type';
import { ConnectionTaskAcceptData, ConnectionTaskDoneData, ConnectionTaskRejectData } from './types/connection-task.type';
import { SocketConnectionType } from './types/socket-connection.type';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  private server: Server;

  constructor(private readonly socketService: SocketService) {}

  afterInit(server: Server) {
    server.use(async (socket, next) => {
      try {
        const authContext = await this.socketService.authenticateSocket(
          socket.handshake.auth.token as string,
          socket.handshake.query.connection_name as string,
          socket.handshake.query.connection_type as SocketConnectionType,
        );

        socket.data.authContext = authContext;
        next();
      }
      catch (error) {
        next(error as Error);
      }
    });
  }

  handleConnection(client: Socket) {
    this.socketService.registerConnection(client, client.data.authContext);
  }

  handleDisconnect(client: Socket) {
    this.socketService.removeConnection(client.id);
  }

  @SubscribeMessage('task-accept')
  async handleTaskAccepted(@ConnectedSocket() client: Socket, @MessageBody() data: ConnectionTaskAcceptData) {
    await this.socketService.handleTaskAccepted(client.id, data.taskId);
  }

  @SubscribeMessage('task-reject')
  async handleTaskRejected(@ConnectedSocket() client: Socket, @MessageBody() data: ConnectionTaskRejectData) {
    await this.socketService.handleTaskRejected(client.id, data.taskId, data.message);
  }

  @SubscribeMessage('task-done')
  async handleTaskDone(@ConnectedSocket() client: Socket, @MessageBody() data: ConnectionTaskDoneData) {
    await this.socketService.handleTaskDone(client.id, data);
  }

  @SubscribeMessage('subscribe-event')
  handleEventSubscribe(@ConnectedSocket() client: Socket, @MessageBody() data: ConnectionSubscribeEventData) {
    if (!data.eventName) {
      client.emit('subscribe-event-error', {
        message: 'eventName in body required',
      });
      return;
    }

    this.socketService.subscribeClientToEvent(client.id, data.eventName);
  }

  @SubscribeMessage('unsubscribe-event')
  handleEventUnsubscribe(@ConnectedSocket() client: Socket, @MessageBody() data: ConnectionSubscribeEventData) {
    if (!data.eventName) {
      client.emit('unsubscribe-event-error', {
        message: 'eventName in body required',
      });
      return;
    }

    this.socketService.unsubscribeClientToEvent(client.id, data.eventName);
  }
}
