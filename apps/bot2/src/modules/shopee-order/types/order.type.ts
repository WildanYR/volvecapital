export type OrderStatus = 'queued' | 'enqueued' | 'processing' | 'success' | 'failed';

export interface OrderRecord {
  module_instance_id: string;
  orderId: string;
  status: OrderStatus;
  createdAt: string;
}
