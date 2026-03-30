export type SocketConnectionType = 'BOT' | 'WEB';

export interface SocketConnectErrorData {
  type: string;
  message: string;
}

export interface ConnectionSubscribeEventData {
  eventName: string;
}

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

export interface SocketAuthContext {
  tenant_id: string;
  name: string;
  type: SocketConnectionType;
}

export interface SocketConnectionSummary {
  id: string;
  name: string;
  tenant_id: string;
  type: SocketConnectionType;
  inflight: number;
  connectedAt: number;
}

export interface DispatchTaskRequest {
  taskId: string;
  tenantId: string;
  dispatchTaskData?: Omit<DispatchTaskData, 'taskId'>;
}

export interface DispatchTaskResponse {
  clientId: string | null;
}

export interface SendEventRequest {
  eventName: string;
  payload: any;
}

export interface SubscriptionRequest {
  clientId: string;
  eventName: string;
}
