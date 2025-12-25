import { Notification } from '../core/notification';
import { NotificationChannelType } from '../types';

/**
 * Base notification event
 */
export abstract class NotificationEvent {
  constructor(
    public readonly notification: Notification,
    public readonly channels: NotificationChannelType[],
  ) {}
}

/**
 * Event fired when a notification is about to be sent
 */
export class NotificationSending extends NotificationEvent {
  constructor(notification: Notification, channels: NotificationChannelType[]) {
    super(notification, channels);
  }
}

/**
 * Event fired after a notification has been sent successfully
 */
/**
 * Event fired after a notification has been sent successfully
 */
export class NotificationSent extends NotificationEvent {
  constructor(
    notification: Notification,
    channels: NotificationChannelType[],
    public readonly responses: Map<NotificationChannelType, unknown>,
  ) {
    super(notification, channels);
  }
}

/**
 * Event fired when a notification fails to send
 */
/**
 * Event fired when a notification fails to send
 */
export class NotificationFailed extends NotificationEvent {
  constructor(
    notification: Notification,
    channels: NotificationChannelType[],
    public readonly error: Error,
    public readonly failedChannel?: NotificationChannelType,
  ) {
    super(notification, channels);
  }
}

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
  private listeners: Map<string, NotificationEventListener<NotificationEvent>[]> = new Map();

  /**
   * Register an event listener
   */
  on<T extends NotificationEvent>(
    // Constructor type needs to accept any arguments for flexibility
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eventType: new (...args: any[]) => T,
    listener: NotificationEventListener<T>,
  ): void {
    const eventName = eventType.name;
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName)!.push(listener as NotificationEventListener<NotificationEvent>);
  }

  /**
   * Dispatch an event to all registered listeners
   */
  async dispatch<T extends NotificationEvent>(event: T): Promise<void> {
    const eventName = event.constructor.name;
    const listeners = this.listeners.get(eventName) || [];

    for (const listener of listeners) {
      try {
        await listener(event);
      } catch (error) {
        console.error(`Error in event listener for ${eventName}:`, error);
      }
    }
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
