/**
 * Netflix Reset Password Module Factory
 */

import type { ModuleDependencies } from '../../types/module.type.js';
import type { ModuleConfig } from '../../types/config.type.js';
import { NetflixModule } from './NetflixModule.js';

export function createNetflixModule(
  deps: ModuleDependencies,
  instanceId: string,
  config: ModuleConfig
): NetflixModule {
  return new NetflixModule(deps, instanceId, config);
}

export { NetflixModule };
