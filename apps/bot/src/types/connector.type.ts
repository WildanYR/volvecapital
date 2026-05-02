export interface ConnectorConnectErrorData {
  type: string;
  message: string;
}

/**
 * Payload dari event "task-dispatch" dari server
 */
export interface DispatchTaskData {
  taskId: string;        // ID task dari server (akan dipakai sebagai id task lokal)
  module: string;        // Nama MODULE (bukan instance id) yang akan mengerjakan task
  type?: string;         // Nama fungsi yang akan dijalankan oleh module
  executeAt?: string;    // Optional: ISO 8601 datetime untuk scheduled task
  payload: any;          // Arguments untuk fungsi di module
}

/**
 * Payload untuk emit "task-done" ke server
 */
export interface TaskDoneData {
  taskId: string;
  status: 'COMPLETED' | 'FAILED';
  message?: string;
}

/**
 * Payload untuk emit "task-reject" ke server
 */
export interface RejectTaskData {
  taskId: string;
  message: string;
}

/**
 * Payload dari event "event" dari server
 */
export interface EventData {
  eventName: string;
  payload: any;
}