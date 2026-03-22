import type { Socket } from 'socket.io';

export type SocketConnectionType = 'BOT' | 'WEB';

export interface SocketConnection {
  socket: Socket;
  name: string;
  tenant_id: string;
  type: SocketConnectionType;
  inflight: number;
  connectedAt: number;
}

export interface SocketAuthContext {
  tenant_id: string;
  name: string;
  type: SocketConnectionType;
}
