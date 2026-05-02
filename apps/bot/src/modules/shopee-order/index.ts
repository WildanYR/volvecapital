/**
 * ShopeeOrderModule Factory
 */

import type { ModuleDependencies } from '../../types/module.type.js';
import type { ModuleConfig } from '../../types/config.type.js';
import { ShopeeOrderModule } from './ShopeeOrderModule.js';

export function createShopeeOrderModule(
  deps: ModuleDependencies,
  instanceId: string,
  config: ModuleConfig
): ShopeeOrderModule {
  return new ShopeeOrderModule(deps, instanceId, config);
}

export { ShopeeOrderModule };
