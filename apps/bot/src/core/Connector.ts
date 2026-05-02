/**
 * Connector - Socket.IO client for external server communication
 */

import { io, type Socket } from 'socket.io-client';
import type { TaskManager } from './TaskManager.js';
import type { Logger } from './Logger.js';
import type { EventBus } from './EventBus.js';
import { AppConfig, ConnectorConfig } from '../types/config.type.js';
import { TaskInput, TaskSource } from '../types/task.type.js';
import type { AuthCredentials } from './auth.js';
import { ConnectorConnectErrorData, DispatchTaskData, EventData, RejectTaskData, TaskDoneData } from '../types/connector.type.js';

interface GetStatusPayload {
    requestId: string;
    statusEndpoint: string;
}

export class Connector {
    private apiBaseUrl: string;
    private appName: string;
    private config: ConnectorConfig;
    private authCredentials: AuthCredentials;
    private taskManager: TaskManager;
    private logger: Logger;
    private eventBus: EventBus;

    private socket: Socket | null = null;
    private isConnected: boolean = false;

    constructor(
        apiBaseUrl: string,
        config: AppConfig,
        authCredentials: AuthCredentials,
        taskManager: TaskManager,
        logger: Logger,
        eventBus: EventBus
    ) {
        this.apiBaseUrl = apiBaseUrl;
        this.appName = config.app.name;
        this.config = config.connector;
        this.authCredentials = authCredentials;
        this.taskManager = taskManager;
        this.logger = logger;
        this.eventBus = eventBus;
    }

    /**
     * Connect to the server
     */
    async connect(): Promise<void> {
        if (!this.config.enabled) {
            this.logger.info('Connector is disabled');
            return;
        }

        return new Promise((resolve, reject) => {
            this.logger.info(`Connecting to server: ${this.apiBaseUrl}`);

            this.socket = io(this.apiBaseUrl, {
                auth: {
                    token: this.authCredentials.token,
                },
                query: {
                    connection_name: this.appName,
                    connection_type: 'BOT'
                },
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 30000,
            });

            // Connection events
            this.socket.on('connect', () => {
                this.isConnected = true;
                this.logger.info('Connected to server');
                resolve();
            });

            this.socket.on('disconnect', (reason) => {
                this.isConnected = false;
                this.logger.warn(`Disconnected from server: ${reason}`);
            });

            this.socket.on('connect_error', (error: any) => {
                const fatalErrors = ['ValidationError', 'InternalServerError', 'InvalidTokenError']
                const errorData = (error.data as ConnectorConnectErrorData) || undefined

                if (errorData && fatalErrors.includes(errorData.type)) {
                    this.socket?.disconnect()
                    this.socket?.removeAllListeners()
                    reject(new Error(errorData.message));
                }

                this.logger.error(`Connection error: ${error.message}`);
            });

            // Register command handlers
            this.registerHandlers();
        });
    }

    /**
     * Disconnect from the server
     */
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            this.logger.info('Disconnected from server');
        }
    }

    /**
     * Check if connected
     */
    getIsConnected(): boolean {
        return this.isConnected;
    }

    /**
     * Register event handlers for server commands
     */
    private registerHandlers(): void {
        if (!this.socket) return;

        // Handle unified task-dispatch event
        this.socket.on('task-dispatch', (payload: DispatchTaskData) => {
            this.handleTaskDispatch(payload);
        });

        // Handle event event
        this.socket.on('event', (payload: EventData) => {
            this.handleEvent(payload);
        });

        // Handle get_status command (response via fetch API)
        this.socket.on('get_status', (payload: GetStatusPayload) => {
            this.handleGetStatus(payload);
        });

        // Subscribe ke EventBus untuk task completion events
        this.subscribeToTaskEvents();

        this.logger.debug('Command handlers registered');
    }

    /**
     * Handle task-dispatch event
     * Unified handler untuk trigger dan scheduled tasks
     */
    private handleTaskDispatch(data: DispatchTaskData): void {
        console.log('task dispatch', { data })
        try {
            this.logger.info(`Received task-dispatch: ${data.taskId} for module ${data.module}`);

            // Find module instance by module name
            const result = this.taskManager.getModuleInstanceByModuleName(data.module);
            if (!result) {
                this.logger.warn(`Module not found: ${data.module}`);
                this.emitTaskReject({
                    taskId: data.taskId,
                    message: `Module not found: ${data.module}`,
                });
                return;
            }

            const { instanceId } = result;

            // Enqueue task with server's taskId and EXTERNAL source
            const taskInput: TaskInput = {
                id: data.taskId,
                moduleInstanceId: instanceId,
                type: data.type || 'processTask',
                source: 'EXTERNAL',  // Mark as external task for status reporting
                payload: data.payload,
                executeAt: data.executeAt ? new Date(data.executeAt) : undefined,
            };

            this.taskManager.enqueueTask(taskInput);
            this.logger.info(`Task enqueued: ${data.taskId} for instance ${instanceId}`);
        } catch (error) {
            this.logger.error(`Error handling task-dispatch: ${error instanceof Error ? error.message : 'Unknown error'}`);
            this.emitTaskReject({
                taskId: data.taskId,
                message: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }

    /**
     * Handle event event
     */
    private handleEvent(data: EventData): void {
        try {
            this.logger.info(`Received event: ${data.eventName}`);
            this.eventBus.emit(data.eventName, data.payload);
        } catch (error) {
            this.logger.error(`Error handling event: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Emit task-reject event ke server
     */
    private emitTaskReject(data: RejectTaskData): void {
        if (!this.socket || !this.isConnected) {
            this.logger.warn('Cannot emit task-reject: not connected');
            return;
        }
        this.socket.emit('task-reject', data);
        this.logger.debug(`Emitted task-reject for ${data.taskId}`);
    }

    /**
     * Emit task-done event ke server
     */
    private emitTaskDone(data: TaskDoneData): void {
        if (!this.socket || !this.isConnected) {
            this.logger.warn('Cannot emit task-done: not connected');
            return;
        }
        this.socket.emit('task-done', data);
        this.logger.debug(`Emitted task-done for ${data.taskId}: ${data.status}`);
    }

    /**
     * Subscribe ke EventBus untuk menerima task completion events
     * Hanya task dengan source 'EXTERNAL' yang dikirim ke server
     */
    private subscribeToTaskEvents(): void {
        // Task completed
        this.eventBus.on<{ taskId: string; source: TaskSource }>('task:completed', (data) => {
            if (data && data.source === 'EXTERNAL') {
                this.emitTaskDone({
                    taskId: data.taskId,
                    status: 'COMPLETED',
                });
            }
        });

        // Task failed
        this.eventBus.on<{ taskId: string; error: string; source: TaskSource }>('task:failed', (data) => {
            if (data && data.source === 'EXTERNAL') {
                this.emitTaskDone({
                    taskId: data.taskId,
                    status: 'FAILED',
                    message: data.error,
                });
            }
        });

        // Task timeout (considered as failed)
        this.eventBus.on<{ taskId: string; moduleInstanceId: string; source: TaskSource }>('task:timeout', (data) => {
            if (data && data.source === 'EXTERNAL') {
                this.emitTaskDone({
                    taskId: data.taskId,
                    status: 'FAILED',
                    message: 'Task timeout',
                });
            }
        });
    }

    /**
     * Handle get_status command - send response via fetch API
     */
    private async handleGetStatus(payload: GetStatusPayload): Promise<void> {
        try {
            this.logger.debug(`Received get_status request: ${payload.requestId}`);

            const status = {
                requestId: payload.requestId,
                timestamp: new Date().toISOString(),
                taskManager: this.taskManager.getStatus(),
            };

            // Send status via fetch API
            const response = await fetch(payload.statusEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `VC ${this.authCredentials.token}`,
                    'x-tenant-id': this.authCredentials.tenantId,
                },
                body: JSON.stringify(status),
            });

            if (!response.ok) {
                this.logger.warn(`Failed to send status: ${response.status}`);
            } else {
                this.logger.debug('Status sent successfully');
            }
        } catch (error) {
            this.logger.error(`Error handling get_status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
