import { LogLevel } from "./logger.type.js";
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
}

export interface LogRow {
  id: number;
  module_instance_id: string | null;
  level: LogLevel;
  message: string;
  timestamp: string;
  synced: number;  // 0 or 1
}