import { NotificationEvent } from './notification-event';
import { Logger } from '../logger';

/**
 * Event listener type
 */
export type NotificationEventListener<T extends NotificationEvent> = (
  event: T,
) => void | Promise<void>;

/**
 * Notification event emitter/dispatcher
 * Similar to Laravel's notification events
 */
export class NotificationEventDispatcher {
  private static instance: NotificationEventDispatcher;
  private listeners: Map<string, NotificationEventListener<NotificationEvent>[]> = new Map();

  constructor() {
    if (!NotificationEventDispatcher.instance) {
      NotificationEventDispatcher.instance = this;
    }
    return NotificationEventDispatcher.instance;
  }

  /**
   * Registers a listener for a specific event type.
   *
   * @param eventName - The class name of the event (e.g., 'NotificationSent').
   * @param callback - Function to execute when the event is dispatched.
   *
   * @example
   * ```typescript
   * manager.events().on('NotificationSent', (event) => {
   *   console.log('Sent!', event.responses);
   * });
   * ```
   */
  on<T extends NotificationEvent>(eventName: string, callback: (event: T) => void | Promise<void>) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName)?.push(callback as unknown as NotificationEventListener<any>);
  }

  /**
   * Dispatches an event to all registered listeners asynchronously.
   *
   * @param event - The event instance to dispatch.
   */
  async dispatch(event: NotificationEvent) {
    const eventName = event.constructor.name;
    const callbacks = this.listeners.get(eventName) || [];

    await Promise.all(
      callbacks.map(async (callback) => {
        try {
          await callback(event);
        } catch (error) {
          Logger.error(`Error in event listener for ${eventName}:`, error);
        }
      }),
    );
  }

  /**
   * Remove all listeners for a specific event type
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  removeListeners<T extends NotificationEvent>(eventType: new (...args: any[]) => T): void {
    const eventName = eventType.name;
    this.listeners.delete(eventName);
  }

  /**
   * Remove all event listeners
   */
  clear(): void {
    this.listeners.clear();
  }
}

/**
 * Global event dispatcher instance (singleton)
 */
let globalDispatcher: NotificationEventDispatcher | null = null;

/**
 * Get the global event dispatcher
 */
export function getEventDispatcher(): NotificationEventDispatcher {
  if (!globalDispatcher) {
    globalDispatcher = new NotificationEventDispatcher();
  }
  return globalDispatcher;
}

/**
 * Set a custom event dispatcher
 */
export function setEventDispatcher(dispatcher: NotificationEventDispatcher): void {
  globalDispatcher = dispatcher;
}
