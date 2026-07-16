import type { ModuleDependencies, ModuleFactory } from '../../types/module.type.js';
import type { ModuleConfig } from '../../types/config.type.js';
import { WhatsappModule } from './whatsapp.module.js';

export const createWhatsappModule: ModuleFactory = (
    deps: ModuleDependencies,
    instanceId: string,
    config: ModuleConfig
) => {
    return new WhatsappModule(deps, instanceId, config);
};
