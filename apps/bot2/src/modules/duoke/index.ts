/**
 * Duoke Module Entry Point
 */

import { ModuleDependencies, ModuleFactory } from '../../types/module.type.js';
import { ModuleConfig } from '../../types/config.type.js';
import { DuokeModule } from './DuokeModule.js';

export const createDuokeModule: ModuleFactory = (
  deps: ModuleDependencies,
  instanceId: string,
  config: ModuleConfig
) => {
  return new DuokeModule(deps, instanceId, config);
};
