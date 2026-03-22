import { LogLevel } from "./logger.type.js";

/**
 * API Authentication config - untuk autentikasi ke server Volve Capital
 */
export interface ApiConfig {
  app_id: string;
  app_secret: string;
}

export interface AppConfig {
  app: {
    name: string;
    max_concurrent_tasks: number;
    task_timeout_ms: number;
    default_loop_interval?: number;  // default interval untuk loop modules (ms)
    api_base_url: string;  // base URL for API server
    browser_recycle_interval_minutes?: number;  // interval untuk global browser recycle (menit), default 60
  };
  api: ApiConfig;
  connector: {
    enabled: boolean;
  };
  logger: {
    level: LogLevel;
  };
  modules: ModuleConfig[];
}

export interface ModuleConfig {
  module: string;      // nama module yang tersedia di app
  name: string;        // instance id (unique)
  loop_interval?: number;  // interval untuk loop iteration (ms), default dari app config
  [key: string]: unknown;  // module-specific config
}

export interface ConnectorConfig {
  enabled: boolean;
}

export interface LoggerConfig {
  level: LogLevel;
}