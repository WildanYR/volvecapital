import type { TaskQueueData } from './task-queue-data.type';
export interface TaskMessage {
    messageId: string;
    taskId: string;
    taskData?: TaskQueueData;
}
