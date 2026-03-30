export interface ConnectionTaskAcceptData {
  taskId: string;
}

export interface ConnectionTaskDoneData {
  taskId: string;
  status: 'COMPLETED' | 'FAILED';
  message?: string;
}

export interface ConnectionTaskRejectData {
  taskId: string;
  message: string;
}

export interface DispatchTaskData {
  taskId: string;
  module?: string;
  type?: string;
  executeAt?: string;
  payload?: any;
}

export interface EventData {
  eventName: string;
  payload: any;
}
