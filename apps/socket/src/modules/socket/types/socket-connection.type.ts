export type SocketConnectionType = 'BOT' | 'WEB';

export interface SocketAuthContext {
  tenant_id: string;
  name: string;
  type: SocketConnectionType;
}

export interface SocketConnectionSummary {
  id: string;
  name: string;
  tenant_id: string;
  type: SocketConnectionType;
  inflight: number;
  connectedAt: number;
}
