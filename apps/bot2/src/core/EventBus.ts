/**
 * EventBus - Global event emitter for inter-module communication
 */

import { EventHandler } from "../types/event.type.js";

type EventHandlerWrapper = {
    handler: EventHandler<unknown>;
    once: boolean;
};

export class EventBus {
    private handlers: Map<string, Set<EventHandlerWrapper>> = new Map();

    /**
     * Subscribe to an event
     */
    on<T = unknown>(event: string, handler: EventHandler<T>): void {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, new Set());
        }
        this.handlers.get(event)!.add({
            handler: handler as EventHandler<unknown>,
            once: false,
        });
    }

    /**
     * Subscribe to an event (fires once then auto-removes)
     */
    once<T = unknown>(event: string, handler: EventHandler<T>): void {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, new Set());
        }
        this.handlers.get(event)!.add({
            handler: handler as EventHandler<unknown>,
            once: true,
        });
    }

    /**
     * Unsubscribe from an event
     */
    off<T = unknown>(event: string, handler: EventHandler<T>): void {
        const wrappers = this.handlers.get(event);
        if (!wrappers) return;

        for (const wrapper of wrappers) {
            if (wrapper.handler === handler) {
                wrappers.delete(wrapper);
                break;
            }
        }

        if (wrappers.size === 0) {
            this.handlers.delete(event);
        }
    }

    /**
     * Emit an event
     */
    emit<T = unknown>(event: string, data?: T): void {
        const wrappers = this.handlers.get(event);
        if (!wrappers) return;

        const toRemove: EventHandlerWrapper[] = [];

        for (const wrapper of wrappers) {
            try {
                const result = wrapper.handler(data);
                // Handle async handlers (fire and forget)
                if (result instanceof Promise) {
                    result.catch(() => {
                        // Ignore async errors in event handlers
                    });
                }
            } catch {
                // Ignore sync errors in event handlers
            }

            if (wrapper.once) {
                toRemove.push(wrapper);
            }
        }

        // Remove once handlers
        for (const wrapper of toRemove) {
            wrappers.delete(wrapper);
        }
    }

    /**
     * Get number of listeners for an event
     */
    listenerCount(event: string): number {
        return this.handlers.get(event)?.size || 0;
    }

    /**
     * Remove all listeners for an event (or all events if no event specified)
     */
    removeAllListeners(event?: string): void {
        if (event) {
            this.handlers.delete(event);
        } else {
            this.handlers.clear();
        }
    }
}
