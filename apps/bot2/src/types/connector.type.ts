export interface ConnectorConnectErrorData {
  type: string;
  message: string;
}

export interface DispatchTaskData {
  taskId: string;
  module?: string;
  type?: string;
  executeAt?: string;
  payload: any;
  options?: {
    maxRetries?: number;
  };
}

export interface TaskDoneData {
  taskId: string;
  status: 'COMPLETED' | 'FAILED';
  message?: string;
}

export interface RejectTaskData {
  taskId: string;
  message: string;
}

export interface EventData {
  eventName: string;
  payload: any;
}

export interface SocketEmailEventData {
  from: string,
  date: string,
  subject: string,
  data: string,
}