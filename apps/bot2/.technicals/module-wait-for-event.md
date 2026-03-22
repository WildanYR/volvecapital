# Event Bus Waiting Mechanism (Reactive Timeout)

This document outlines the design for waiting for Event Bus events within a module method (`BaseModule`) without implementing redundant internal timeouts. Instead, it leverages the `TaskManager`'s existing "zombie killer" mechanism.

## Core Concept: Reactive Timeout

Instead of the module managing its own countdown timer (`setTimeout`), the module enters a "Waiting State" where it listens for two possible signals:
1.  **Success Signal:** The specific data event from the Connector/API.
2.  **Abort Signal:** The `task:timeout` event emitted by the `TaskManager`.

This ensures that the timeout duration is centrally managed by `config.app.task_timeout_ms` and avoids conflicting timer logic.

## Implementation Design

### 1. Connector (`Connector.ts`)
*   **Role:** Bridge between external Socket.IO events and the internal `EventBus`.
*   **Implementation:** The connector listens for a generic `'event'` from the server. This event contains the target `eventName` and `payload`.
    ```typescript
    // Register handler for generic 'event'
    this.socket.on('event', (payload: EventData) => {
        this.handleEvent(payload);
    });

    // Handler logic: Forward specific event to internal bus
    private handleEvent(data: EventData): void {
        this.eventBus.emit(data.eventName, data.payload);
    }
    ```

### 2. BaseModule (`BaseModule.ts`)
*   **Role:** Consume the event with a helper method that efficiently manages listeners.
*   **New Helper Requirement:** `waitForTaskEvent<T>(taskId: string, eventName: string): Promise<T>`

### 3. Execution Flow

1.  **Start:** Module executes a task (e.g., `resetPlatformPassword`) and triggers an external process (Webhook/API).
2.  **Wait:** Module calls `await this.waitForTaskEvent(task.id, 'reset_result')`.
    *   The helper registers a `.once()` listener for the **Success Event** (`'reset_result'`).
    *   The helper registers a `.on()` listener for the **`task:timeout`** event.
3.  **Resolution:**
    *   **Scenario A: Success**
        *   Server sends generic event: `{ eventName: 'reset_result', payload: { ... } }`.
        *   Connector forwards it as internal event: `'reset_result'`.
        *   **Action:** Module receives event, unsubscribes from `task:timeout`, and resolves Promise.
    *   **Scenario B: Timeout (Handled by TaskManager)**
        *   Global task timer expires. `TaskManager` emits `task:timeout`.
        *   **Action:** Helper catches this event. Checks if `payload.taskId` matches current task.
        *   If match: Unsubscribe from success event, reject the Promise ("Task aborted by Manager").

## Benefits
*   **Single Source of Truth:** Timeout duration is controlled solely by `app.config`.
*   **Resource Efficiency:** No extra timers created in memory for every waiting task.
*   **Leak Prevention:** Ensures all Event Bus listeners are cleaned up, even if the task is killed forcefully by the manager.
