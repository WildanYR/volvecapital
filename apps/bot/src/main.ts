/**
 * Volve Capital Bot - Main Entry Point
 */

import { resolve } from 'node:path';
import { ConfigLoader } from './core/ConfigLoader.js';
import { Database } from './core/Database.js';
import { Logger } from './core/Logger.js';
import { EventBus } from './core/EventBus.js';
import { TaskManager } from './core/TaskManager.js';
import { Connector } from './core/Connector.js';
import { getModuleFactory, getRegisteredModuleNames } from './modules/index.js';
import { getAuthCredentials, type AuthCredentials } from './core/auth.js';
import { getGlobalBrowser } from './utils/browser.js';
import type { AppConfig } from './types/config.type.js';

class Application {
    private config!: AppConfig;
    private db!: Database;
    private logger!: Logger;
    private eventBus!: EventBus;
    private taskManager!: TaskManager;
    private connector!: Connector;
    private authCredentials!: AuthCredentials;

    async start(): Promise<void> {
        try {
            // 1. Load configuration
            console.log('Loading configuration...');
            const configLoader = new ConfigLoader();
            this.config = configLoader.load();
            console.log(`Configuration loaded: ${this.config.app.name}`);

            // 2. Initialize database
            const dbPath = resolve(process.cwd(), 'storage', 'database.sqlite');
            this.db = new Database(dbPath);
            this.db.initSystemTables();
            console.log('Database initialized');

            // 3. Get auth credentials (from DB or fetch from API)
            this.authCredentials = await getAuthCredentials(
                this.db,
                this.config.app.api_base_url,
                this.config.api.email,
                this.config.api.password
            );
            console.log('Auth credentials obtained');

            // 4. Initialize logger (no longer needs database)
            this.logger = new Logger(this.config.logger, this.authCredentials, this.config.app.api_base_url);
            this.logger.info(`Starting ${this.config.app.name}...`);

            // Initialize browser early with headless setting
            await getGlobalBrowser({ headless: this.config.app.headless });

            // 5. Initialize event bus
            this.eventBus = new EventBus();
            this.logger.info('EventBus initialized');

            // 6. Initialize task manager
            this.taskManager = new TaskManager(
                this.config,
                this.db,
                this.logger,
                this.eventBus
            );
            this.logger.info('TaskManager initialized');

            // 7. Initialize connector
            this.connector = new Connector(
                this.config.app.api_base_url,
                this.config,
                this.authCredentials,
                this.taskManager,
                this.logger,
                this.eventBus
            );
            this.logger.info('Connector initialized');

            // 8. Connect to external server (if enabled)
            if (this.config.connector.enabled) {
                try {
                    await this.connector.connect();
                } catch (error) {
                    this.logger.error(`Failed to connect to server: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    process.exit(1)
                }
            }

            // 9. Load and register modules
            await this.loadModules();

            // 10. Start components
            await this.taskManager.start();

            this.logger.info(`${this.config.app.name} started successfully!`);
            this.logger.info(`Registered modules: ${this.taskManager.getStatus().registeredModules.join(', ') || 'none'}`);

            // Setup graceful shutdown
            this.setupShutdownHandlers();

        } catch (error) {
            console.error('Failed to start application:', error instanceof Error ? error.message : 'Unknown error');
            process.exit(1);
        }
    }

    private async loadModules(): Promise<void> {
        const registeredNames = getRegisteredModuleNames();
        this.logger.info(`Available modules: ${registeredNames.join(', ') || 'none'}`);

        for (const moduleConfig of this.config.modules) {
            const factory = getModuleFactory(moduleConfig.module);

            if (!factory) {
                this.logger.error(`Module not found: ${moduleConfig.module}`);
                throw new Error(`Module '${moduleConfig.module}' is not registered. Available modules: ${registeredNames.join(', ')}`);
            }

            // Create module instance
            const instance = factory(
                {
                    db: this.db,
                    logger: this.logger,
                    eventBus: this.eventBus,
                    taskManager: this.taskManager,
                    apiBaseUrl: this.config.app.api_base_url,
                    authCredentials: this.authCredentials,
                },
                moduleConfig.name,
                moduleConfig
            );

            // Setup schema and initialize
            await instance.setupSchema();
            await instance.init();

            // Register with task manager
            this.taskManager.registerModule(moduleConfig.name, instance, moduleConfig.module);
            this.logger.info(`Module loaded: ${moduleConfig.name} (${moduleConfig.module})`);
        }
    }

    private setupShutdownHandlers(): void {
        const shutdown = async (signal: string) => {
            this.logger.info(`Received ${signal}, shutting down...`);

            try {
                // Stop components in reverse order
                this.connector.disconnect();
                await this.taskManager.stop();
                await this.logger.close();
                this.db.close();

                this.logger.info('Shutdown complete');
                process.exit(0);
            } catch (error) {
                console.error('Error during shutdown:', error);
                process.exit(1);
            }
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
    }
}

// Start application
const app = new Application();
app.start();