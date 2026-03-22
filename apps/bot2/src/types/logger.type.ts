export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogToDbLevel = 'INFO' | 'NEED_ACTION' | 'WARN' | 'ERROR';

export interface LogToDbOptions {
  level: LogToDbLevel;
  context: string;
  customMessage?: string;
}

export interface LogContext {
  instanceId?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: LogContext;
}