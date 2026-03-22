import type { Subject } from 'rxjs';
export interface SseEvent<T = any> {
    data: T;
    id?: string;
    type?: string;
}
export type BotStatus = 'IDLE' | 'BUSY' | 'OFFLINE';
export interface IBotConn {
    id: string;
    name: string;
    tenant_id: string;
    modifier: string;
    status: BotStatus;
    inflight: number;
    subject: Subject<SseEvent>;
    connectedAt: number;
}
export type TaskStatus = 'QUEUED' | 'DISPATCHED' | 'ACKED' | 'COMPLETED' | 'FAILED' | 'TIMED_OUT' | 'CANCELLED';
export interface TaskRecord<T = any> {
    taskId: string;
    tenantId: string;
    modifier: string;
    botId?: string;
    payload: T;
    status: TaskStatus;
    attempts: number;
    createdAt: number;
    ackBy?: number;
    doneBy?: number;
    ackTimer?: NodeJS.Timeout;
    doneTimer?: NodeJS.Timeout;
    error?: string | null;
}
