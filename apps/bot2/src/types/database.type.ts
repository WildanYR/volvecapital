import { TaskStatus } from "./task.type.js";

export interface KVStoreRow {
  key: string;
  value: string;
  updated_at: string;
}

export interface TaskRow {
  id: string;
  module_instance_id: string;
  type: string;
  source: string;  // 'EXTERNAL' | 'INTERNAL'
  status: TaskStatus;
  payload: string;  // JSON string
  execute_at: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  error: string | null;
  max_retries: number;
  retry_count: number;
}