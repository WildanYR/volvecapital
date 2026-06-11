/**
 * Connector - Standard WebSocket client for external server communication
 */

import { WebSocket } from "ws";
import type { TaskManager } from "./TaskManager.js";
import type { Logger } from "./Logger.js";
import type { EventBus } from "./EventBus.js";
import { AppConfig } from "../types/config.type.js";
import type { ConnectorConfig } from "../types/config.type.js";
import { TaskInput, TaskSource } from "../types/task.type.js";
import type { AuthCredentials } from "./auth.js";
import {
  ConnectorConnectErrorData,
  DispatchTaskData,
  EventData,
  RejectTaskData,
  TaskDoneData,
} from "../types/connector.type.js";

interface GetStatusPayload {
  requestId: string;
  statusEndpoint: string;
}

interface CustomWebSocket extends WebSocket {
  id?: string;
}

export class Connector {
  private socketBaseUrl: string;
  private appName: string;
  private config: ConnectorConfig;
  private authCredentials: AuthCredentials;
  private taskManager: TaskManager;
  private logger: Logger;
  private eventBus: EventBus;

  private socket: CustomWebSocket | null = null;
  private isConnected: boolean = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private intentionalDisconnect = false;

  constructor(
    config: AppConfig,
    authCredentials: AuthCredentials,
    taskManager: TaskManager,
    logger: Logger,
    eventBus: EventBus,
  ) {
    this.socketBaseUrl = config.app.api_websocket_url;
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
      this.logger.info("Connector is disabled");
      return;
    }

    this.intentionalDisconnect = false;

    return new Promise((resolve, reject) => {
      this.logger.info(`Connecting to server: ${this.socketBaseUrl}`);

      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }

      const wsUrl = new URL(this.socketBaseUrl);
      wsUrl.pathname = "/socket.io/";
      wsUrl.searchParams.set("token", this.authCredentials.token);
      wsUrl.searchParams.set("connection_name", this.appName);
      wsUrl.searchParams.set("connection_type", "BOT");

      const socket = new WebSocket(wsUrl.toString()) as CustomWebSocket;
      this.socket = socket;

      let resolved = false;

      socket.on("open", () => {
        this.logger.info("WebSocket connection opened, waiting for authentication...");
      });

      socket.on("message", (rawData) => {
        try {
          const parsed = JSON.parse(rawData.toString());
          const { event, data } = parsed;

          if (event === "connect_error") {
            const fatalErrors = [
              "ValidationError",
              "InternalServerError",
              "InvalidTokenError",
            ];
            if (data && fatalErrors.includes(data.type)) {
              this.intentionalDisconnect = true;
              socket.close();
              if (!resolved) {
                resolved = true;
                reject(new Error(data.message));
              }
              return;
            }
          }

          if (event === "connected") {
            socket.id = data.id;
            this.isConnected = true;
            this.logger.info(`Connected and authenticated with ID: ${data.id}`);
            this.broadcastSocketStatus();
            this.reconnectDelay = 1000;
            this.registerHandlers();
            if (!resolved) {
              resolved = true;
              resolve();
            }
            return;
          }

          if (this.isConnected) {
            switch (event) {
              case "task-dispatch":
                this.handleTaskDispatch(data);
                break;
              case "event":
                this.handleEvent(data);
                break;
              case "get_status":
                this.handleGetStatus(data);
                break;
            }
          }
        } catch (error) {
          this.logger.error(`Error parsing WS message: ${error instanceof Error ? error.message : String(error)}`);
        }
      });

      socket.on("close", (code, reason) => {
        const reasonStr = reason.toString() || `code ${code}`;
        this.handleClose(reasonStr);
        if (!resolved) {
          resolved = true;
          reject(new Error(`WebSocket closed before auth: ${reasonStr}`));
        }
      });

      socket.on("error", (error) => {
        this.logger.error(`Socket error: ${error.message}`);
      });
    });
  }

  /**
   * Disconnect from the server
   */
  disconnect(): void {
    this.intentionalDisconnect = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
      this.logger.info("Disconnected from server");
    }
  }

  /**
   * Check if connected
   */
  getIsConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Handle close event and schedule reconnection
   */
  private handleClose(reason: string): void {
    this.isConnected = false;
    this.logger.warn(`Disconnected from server: ${reason}`);
    this.broadcastSocketStatus();

    if (this.config.enabled && !this.intentionalDisconnect) {
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }
      this.logger.info(`Reconnecting in ${this.reconnectDelay}ms...`);
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
        this.connect().catch((err) => {
          this.logger.error(`Reconnection attempt failed: ${err.message}`);
        });
      }, this.reconnectDelay);
    }
  }

  /**
   * Register event handlers for server commands
   */
  private registerHandlers(): void {
    // Subscribe ke EventBus untuk task completion events
    this.listenToEventBus();

    this.logger.debug("Command handlers registered");
  }

  /**
   * Handle task-dispatch event
   * Unified handler untuk trigger dan scheduled tasks
   */
  private handleTaskDispatch(data: DispatchTaskData): void {
    try {
      this.logger.info(
        `Received task-dispatch: ${data.taskId} for module ${data.module}`,
      );

      if (!data.module) {
        this.emitTaskReject({
          taskId: data.taskId,
          message: "Module is required",
        });
        return;
      }

      // Find module instance by module name
      const result = this.taskManager.getModuleInstanceByModuleName(
        data.module,
      );
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
        type: data.type || "processTask",
        source: "EXTERNAL", // Mark as external task for status reporting
        payload: data.payload,
        executeAt: data.executeAt ? new Date(data.executeAt) : undefined,
        maxRetries: data.options?.maxRetries,
      };

      this.taskManager.enqueueTask(taskInput);
      this.logger.info(
        `Task enqueued: ${data.taskId} for instance ${instanceId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error handling task-dispatch: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      this.emitTaskReject({
        taskId: data.taskId,
        message: error instanceof Error ? error.message : "Unknown error",
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
      this.logger.error(
        `Error handling event: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Emit task-reject event ke server
   */
  private emitTaskReject(data: RejectTaskData): void {
    if (!this.socket || !this.isConnected) {
      this.logger.warn("Cannot emit task-reject: not connected");
      return;
    }
    this.socket.send(JSON.stringify({ event: "task-reject", data }));
    this.logger.debug(`Emitted task-reject for ${data.taskId}`);
  }

  /**
   * Emit task-done event ke server
   */
  private emitTaskDone(data: TaskDoneData): void {
    if (!this.socket || !this.isConnected) {
      this.logger.warn("Cannot emit task-done: not connected");
      return;
    }
    this.socket.send(JSON.stringify({ event: "task-done", data }));
    this.logger.debug(`Emitted task-done for ${data.taskId}: ${data.status}`);
  }

  private broadcastSocketStatus(): void {
    const clientId = this.isConnected && this.socket ? this.socket.id : null;
    this.eventBus.emit("socket:status", {
      clientId,
      isConnected: this.isConnected,
    });
  }

  /**
   * Subscribe ke EventBus untuk menerima task completion events
   * Hanya task dengan source 'EXTERNAL' yang dikirim ke server
   */
  private listenToEventBus(): void {
    // Task completed
    this.eventBus.on<{ taskId: string; source: TaskSource }>(
      "task:completed",
      (data) => {
        if (data && data.source === "EXTERNAL") {
          this.emitTaskDone({
            taskId: data.taskId,
            status: "COMPLETED",
          });
        }
      },
    );

    // Task failed
    this.eventBus.on<{ taskId: string; error: string; source: TaskSource }>(
      "task:failed",
      (data) => {
        if (data && data.source === "EXTERNAL") {
          this.emitTaskDone({
            taskId: data.taskId,
            status: "FAILED",
            message: data.error,
          });
        }
      },
    );

    // Task timeout (considered as failed)
    this.eventBus.on<{
      taskId: string;
      moduleInstanceId: string;
      source: TaskSource;
    }>("task:timeout", (data) => {
      if (data && data.source === "EXTERNAL") {
        this.emitTaskDone({
          taskId: data.taskId,
          status: "FAILED",
          message: "Task timeout",
        });
      }
    });

    this.eventBus.on("socket:request-status", () => {
      this.broadcastSocketStatus();
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
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `VC ${this.authCredentials.token}`,
          "x-tenant-id": this.authCredentials.tenantId,
        },
        body: JSON.stringify(status),
      });

      if (!response.ok) {
        this.logger.warn(`Failed to send status: ${response.status}`);
      } else {
        this.logger.debug("Status sent successfully");
      }
    } catch (error) {
      this.logger.error(
        `Error handling get_status: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}
