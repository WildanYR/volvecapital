import type { WebSocket } from 'ws';
import type { SocketAuthContext } from './socket-connection.type';

export interface CustomWebSocket extends WebSocket {
  id: string;
  authContext?: SocketAuthContext;
}
