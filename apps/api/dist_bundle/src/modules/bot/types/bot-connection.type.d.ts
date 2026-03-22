import type { Socket } from 'socket.io';
export type BotStatus = 'IDLE' | 'BUSY';
export interface BotConnection {
    id: string;
    tenant_id: string;
    socket: Socket;
    name: string;
    type: string;
    status: BotStatus;
    inflight: number;
    connectedAt: number;
}
