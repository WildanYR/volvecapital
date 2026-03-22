export interface TaskQueueUpdate {
  id: string;
  status: string;
  attempt: number;
  error_message?: string;
}
