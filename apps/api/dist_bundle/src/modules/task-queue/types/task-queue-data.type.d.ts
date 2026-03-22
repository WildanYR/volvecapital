export type TaskQueueContext = 'SUBS_END_NOTIFY' | 'NETFLIX_RESET_PASSWORD' | 'UNFREEZE_ACCOUNT';
export interface TaskQueueData {
    id: string;
    tenant_id: string;
    context: TaskQueueContext;
    payload: any;
}
