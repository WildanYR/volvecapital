import type { TaskQueueData } from './task-queue-data.type';

export interface TaskMessage {
  messageId: string;
  taskId: string;
  attempt?: number;
  taskData?: TaskQueueData;
}
