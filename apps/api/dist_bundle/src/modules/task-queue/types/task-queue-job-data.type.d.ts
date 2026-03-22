export interface ITaskQueueJobData {
    id: string;
    tenant_id: string;
    context: 'SUBS_END_NOTIFY' | 'NETFLIX_RESET_PASSWORD' | 'FREEZE_ACCOUNT';
    payload: string;
}
