export type TaskStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'TIMEOUT';

/**
 * Sumber task:
 * - EXTERNAL: dari server via task-dispatch, status harus dikirim ke server
 * - INTERNAL: dari module di app (loop, internal trigger), status TIDAK dikirim ke server
 */
export type TaskSource = 'EXTERNAL' | 'INTERNAL';

export interface Task {
  id: string;
  moduleInstanceId: string;
  type: string;  // Nama fungsi yang akan dipanggil di module
  source: TaskSource;
  payload: Record<string, unknown>;
  status: TaskStatus;
  executeAt: Date;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface TaskInput {
  id?: string;  // Optional: external task id dari server
  moduleInstanceId: string;
  type: string;
  source?: TaskSource;  // Default: 'INTERNAL'
  payload?: Record<string, unknown>;
  executeAt?: Date;  // kapan task dieksekusi, default: sekarang (immediate)
}