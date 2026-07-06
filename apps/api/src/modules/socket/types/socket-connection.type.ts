import type { Socket } from 'socket.io';

export type SocketConnectionType = 'BOT' | 'WEB' | 'DASHBOARD';

export interface SocketConnection {
  socket: Socket;
  name: string;
  tenant_id: string;
  type: SocketConnectionType;
  inflight: number;
  connectedAt: number;
  is_primary?: boolean;
}

export interface SocketAuthContext {
  tenant_id: string;
  name: string;
  type: SocketConnectionType;
  is_primary?: boolean;
}
