/**
 * Module Registry - Dynamic module loading
 */

import { ModuleFactory } from "../types/module.type.js";

// Module registry - add new modules here
const moduleRegistry: Map<string, ModuleFactory> = new Map();

/**
 * Register a module factory
 */
export function registerModuleFactory(name: string, factory: ModuleFactory): void {
    moduleRegistry.set(name, factory);
}

/**
 * Get a module factory by name
 */
export function getModuleFactory(name: string): ModuleFactory | undefined {
    return moduleRegistry.get(name);
}

/**
 * Get all registered module names
 */
export function getRegisteredModuleNames(): string[] {
    return Array.from(moduleRegistry.keys());
}

/**
 * Check if a module is registered
 */
export function isModuleRegistered(name: string): boolean {
    return moduleRegistry.has(name);
}

// =============================================================================
// Register built-in modules here
// =============================================================================

// ShopeeOrderModule
import { createShopeeOrderModule } from './shopee-order/index.js';
registerModuleFactory('shopee-order', createShopeeOrderModule);

// NetflixModule
import { createNetflixModule } from './netflix/index.js';
registerModuleFactory('netflix', createNetflixModule);

