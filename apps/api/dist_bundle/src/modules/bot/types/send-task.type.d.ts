export interface SendTaskStatus {
    delivered: boolean;
    bot_name?: string;
    reason?: string;
    taskId: string;
}
