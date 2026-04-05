/**
 * ConfigLoader - Load and validate TOML configuration
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { load as parseToml } from 'js-toml';
import { AppConfig, ModuleConfig, ApiConfig } from '../types/config.type.js';
import { LogLevel } from '../types/logger.type.js';
import { getProjectRoot } from '../utils/path.js';
import { normalizeApiBaseHost } from '../utils/api-url.js';

export class ConfigLoader {
    private config: AppConfig | null = null;
    private configPath: string;

    constructor(configPath?: string) {
        this.configPath = configPath || resolve(getProjectRoot(), 'config.toml');
    }

    /**
     * Load and parse config file
     */
    load(): AppConfig {
        if (!existsSync(this.configPath)) {
            throw new Error(`Config file not found: ${this.configPath}`);
        }

        const content = readFileSync(this.configPath, 'utf-8');

        let parsed: unknown;
        try {
            parsed = parseToml(content);
        } catch (error) {
            throw new Error(`Failed to parse config file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        this.config = this.validate(parsed);
        return this.config;
    }

    /**
     * Get loaded config
     */
    getConfig(): AppConfig {
        if (!this.config) {
            throw new Error('Config not loaded. Call load() first.');
        }
        return this.config;
    }

    /**
     * Validate parsed config
     */
    private validate(parsed: unknown): AppConfig {
        if (!parsed || typeof parsed !== 'object') {
            throw new Error('Config must be an object');
        }

        const config = parsed as Record<string, unknown>;

        // Validate [app] section
        const app = this.validateAppSection(config['app']);

        // Validate [api] section
        const api = this.validateApiSection(config['api']);

        // Validate [connector] section
        const connector = this.validateConnectorSection(config['connector']);

        // Validate [logger] section
        const logger = this.validateLoggerSection(config['logger']);

        // Validate [[modules]] section
        const modules = this.validateModulesSection(config['modules']);

        return { app, api, connector, logger, modules };
    }

    private validateAppSection(app: unknown): AppConfig['app'] {
        if (!app || typeof app !== 'object') {
            throw new Error('[app] section is required');
        }

        const section = app as Record<string, unknown>;

        if (typeof section['name'] !== 'string') {
            throw new Error('[app.name] must be a string');
        }

        if (typeof section['max_concurrent_tasks'] !== 'number' || section['max_concurrent_tasks'] < 1) {
            throw new Error('[app.max_concurrent_tasks] must be a positive number');
        }

        if (typeof section['task_timeout_ms'] !== 'number' || section['task_timeout_ms'] < 1000) {
            throw new Error('[app.task_timeout_ms] must be a number >= 1000');
        }

        if (section['headless'] !== undefined && typeof section['headless'] !== 'boolean') {
            throw new Error('[app.headless] must be a boolean');
        }

        if (typeof section['api_base_url'] !== 'string' || !section['api_base_url']) {
            throw new Error('[app.api_base_url] is required');
        }

        const apiBaseHost = normalizeApiBaseHost(section['api_base_url']);

        return {
            name: section['name'],
            max_concurrent_tasks: section['max_concurrent_tasks'],
            task_timeout_ms: section['task_timeout_ms'],
            headless: section['headless'] as boolean | undefined ?? false,
            default_loop_interval: section['default_loop_interval'] as number | undefined,
            api_base_url: apiBaseHost,
            browser_recycle_interval_minutes: section['browser_recycle_interval_minutes'] as number | undefined,
        };
    }

    private validateApiSection(api: unknown): ApiConfig {
        if (!api || typeof api !== 'object') {
            throw new Error('[api] section is required');
        }

        const section = api as Record<string, unknown>;

        if (typeof section['app_id'] !== 'string' || !section['app_id']) {
            throw new Error('[api.app_id] is required');
        }

        if (typeof section['app_secret'] !== 'string' || !section['app_secret']) {
            throw new Error('[api.app_secret] is required');
        }

        return {
            app_id: section['app_id'],
            app_secret: section['app_secret'],
        };
    }

    private validateConnectorSection(connector: unknown): AppConfig['connector'] {
        // Default values if not provided
        if (!connector) {
            return {
                enabled: false,
            };
        }

        if (typeof connector !== 'object') {
            throw new Error('[connector] must be an object');
        }

        const section = connector as Record<string, unknown>;

        return {
            enabled: section['enabled'] === true,
        };
    }

    private validateLoggerSection(logger: unknown): AppConfig['logger'] {
        // Default values if not provided
        if (!logger) {
            return {
                level: 'info',
            };
        }

        if (typeof logger !== 'object') {
            throw new Error('[logger] must be an object');
        }

        const section = logger as Record<string, unknown>;
        const validLevels: LogLevel[] = ['debug', 'info', 'warn', 'error'];

        const level = (section['level'] as LogLevel) || 'info';
        if (!validLevels.includes(level)) {
            throw new Error(`[logger.level] must be one of: ${validLevels.join(', ')}`);
        }

        return {
            level,
        };
    }

    private validateModulesSection(modules: unknown): ModuleConfig[] {
        // Empty modules is allowed (no modules configured)
        if (!modules) {
            return [];
        }

        if (!Array.isArray(modules)) {
            throw new Error('[[modules]] must be an array');
        }

        const instanceNames = new Set<string>();

        return modules.map((mod, index) => {
            if (!mod || typeof mod !== 'object') {
                throw new Error(`[[modules]][${index}] must be an object`);
            }

            const m = mod as Record<string, unknown>;

            if (typeof m['module'] !== 'string' || !m['module']) {
                throw new Error(`[[modules]][${index}].module is required`);
            }

            if (typeof m['name'] !== 'string' || !m['name']) {
                throw new Error(`[[modules]][${index}].name is required`);
            }

            // Check for duplicate instance names
            if (instanceNames.has(m['name'])) {
                throw new Error(`Duplicate module instance name: ${m['name']}`);
            }
            instanceNames.add(m['name']);

            return {
                ...m,
                module: m['module'],
                name: m['name'],
            } as ModuleConfig;
        });
    }
}
