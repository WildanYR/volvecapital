export interface DispatchTaskRequest {
  taskId: string;
  tenantId: string;
  dispatchTaskData?: {
    module?: string;
    type?: string;
    executeAt?: string;
    payload?: any;
    maxRetries?: number;
  };
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

export interface SocketConnectionSummary {
  id: string;
  name: string;
  tenant_id: string;
  type: 'BOT' | 'WEB';
  inflight: number;
  connectedAt: number;
}
