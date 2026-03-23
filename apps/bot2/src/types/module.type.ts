import { ModuleConfig } from './config.type.js';
import type { AuthCredentials } from '../core/auth.js';

export interface ModuleDependencies {
  db: import('../core/Database.ts').Database;
  logger: import('../core/Logger.ts').Logger;
  eventBus: import('../core/EventBus.ts').EventBus;
  taskManager: import('../core/TaskManager.ts').TaskManager;
  apiBaseUrl: string;
  authCredentials: AuthCredentials;
}

export type ModuleFactory = (
  deps: ModuleDependencies,
  instanceId: string,
  config: ModuleConfig
) => import('../core/BaseModule.ts').BaseModule;

