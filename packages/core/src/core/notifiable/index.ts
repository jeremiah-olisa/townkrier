import { Notification } from '../notification';
import { NotificationChannel } from '../../types';
import { NotificationManager } from '../notification-manager';
import { NotificationRecipient } from '../../interfaces';
import { notify } from './utils';

export * from './utils';

/**
 * Abstract base class for objects that can receive notifications
 *
 * Extend this class to create entities (like User, Admin, Customer) that can receive
 * notifications through various channels.
 *
 * @example
 * ```typescript
 * class User extends Notifiable {
 *   constructor(
 *     public id: string,
 *     public email: string,
 *     public phone?: string,
 *     public name?: string,
 *     manager?: NotificationManager
 *   ) {
 *     super(manager);
 *   }
 *
 *   routeNotificationFor(channel: NotificationChannel): string | undefined {
 *     switch(channel) {
 *       case NotificationChannel.EMAIL: return this.email;
 *       case NotificationChannel.SMS: return this.phone;
 *       default: return this.email;
 *     }
 *   }
 *
 *   getNotificationName(): string {
 *     return this.name || 'User';
 *   }
 * }
 *
 * // With injected manager
 * const user = new User('123', 'user@example.com', '+1234567890', 'John', notificationManager);
 * await user.notify(new WelcomeNotification()); // Uses injected manager
 *
 * // Or pass manager explicitly
 * const user2 = new User('456', 'user2@example.com');
 * await user2.notify(new WelcomeNotification(), notificationManager);
 * ```
 */
export abstract class Notifiable {
  /**
   * Optional notification manager injected into this entity
   * If provided, allows calling notify() without passing the manager explicitly
   */
  protected notificationManager?: NotificationManager;

  /**
   * Constructor for Notifiable
   * @param manager - Optional notification manager to inject
   */
  constructor(manager?: NotificationManager) {
    this.notificationManager = manager;
  }
  /**
   * Get the notification routing information for the given channel
   * This method should return the appropriate routing information (email, phone, device token, etc.)
   * for each notification channel
   *
   * @param channel - The notification channel
   * @returns The routing information (e.g., email address, phone number, device token)
   *          Can be string, array of strings, or complex object depending on the channel
   */
  abstract routeNotificationFor(channel: NotificationChannel): string | string[] | unknown;

  /**
   * Get the preferred display name for this notifiable entity
   * Used in notification content for personalization
   *
   * @returns The display name (e.g., "John Doe", "Admin User")
   */
  abstract getNotificationName?(): string;

  /**
   * Set or update the notification manager for this entity
   * Useful for dependency injection scenarios
   *
   * @param manager - The notification manager instance
   * @returns This instance for method chaining
   *
   * @example
   * ```typescript
   * const user = new User('123', 'user@example.com');
   * user.setNotificationManager(manager);
   * await user.notify(new WelcomeNotification());
   * ```
   */
  setNotificationManager(manager: NotificationManager): this {
    this.notificationManager = manager;
    return this;
  }

  /**
   * Get the current notification manager
   * @returns The notification manager or undefined
   */
  getNotificationManager(): NotificationManager | undefined {
    return this.notificationManager;
  }

  /**
   * Send a notification to this entity using the injected manager
   *
   * @param notification - The notification to send
   * @returns Promise resolving to a map of channels and their responses
   * @throws Error if no manager is injected
   *
   * @example
   * ```typescript
   * const user = new User('123', 'user@example.com', '+1234567890', 'John', manager);
   * await user.notify(new WelcomeNotification());
   * ```
   */
  notify(notification: Notification): Promise<Map<NotificationChannel, unknown>>;

  /**
   * Send a notification to this entity using an explicit manager
   *
   * @param notification - The notification to send
   * @param manager - The notification manager instance
   * @returns Promise resolving to a map of channels and their responses
   *
   * @example
   * ```typescript
   * const user = new User('123', 'user@example.com');
   * await user.notify(new WelcomeNotification(), manager);
   * ```
   */
  notify(
    notification: Notification,
    manager: NotificationManager,
  ): Promise<Map<NotificationChannel, unknown>>;

  /**
   * Implementation of notify with optional manager parameter
   */
  notify(
    notification: Notification,
    manager?: NotificationManager,
  ): Promise<Map<NotificationChannel, unknown>> {
    const managerToUse = manager || this.notificationManager;

    if (!managerToUse) {
      throw new Error(
        'No notification manager available. Either pass a manager explicitly or inject one via constructor/setNotificationManager()',
      );
    }

    return notify(this, notification, managerToUse);
  }

  /**
   * Build a NotificationRecipient object from this notifiable entity
   * Useful when you need to pass recipient info to queue or storage systems
   *
   * @param channels - Optional array of channels to include. If not provided, uses all channels from the notification
   * @param notification - Optional notification to determine channels
   * @returns NotificationRecipient object with routing info for each channel
   *
   * @example
   * ```typescript
   * const user = new User('123', 'user@example.com', '+1234567890');
   * const recipient = user.toRecipient([NotificationChannel.EMAIL, NotificationChannel.SMS]);
   * // { email: 'user@example.com', sms: '+1234567890' }
   * ```
   */
  toRecipient(
    channels?: NotificationChannel[],
    notification?: Notification,
  ): NotificationRecipient {
    const channelsToUse = channels || notification?.via() || [];
    const recipient: NotificationRecipient = {} as NotificationRecipient;

    for (const channel of channelsToUse) {
      const routingInfo = this.routeNotificationFor(channel);
      if (routingInfo !== undefined && routingInfo !== null) {
        recipient[channel] = routingInfo;
      }
    }

    return recipient;
  }

  /**
   * Check if this entity has routing information for a specific channel
   * Useful for conditionally sending notifications
   *
   * @param channel - The channel to check
   * @returns true if routing info exists, false otherwise
   *
   * @example
   * ```typescript
   * if (user.hasChannelRoute(NotificationChannel.SMS)) {
   *   await user.notify(new SmsNotification(), manager);
   * }
   * ```
   */
  hasChannelRoute(channel: NotificationChannel): boolean {
    const route = this.routeNotificationFor(channel);
    return route !== undefined && route !== null && route !== '';
  }

  /**
   * Get all available channels for this entity
   * Returns channels that have valid routing information
   *
   * @returns Array of available notification channels
   *
   * @example
   * ```typescript
   * const channels = user.getAvailableChannels();
   * // [NotificationChannel.EMAIL, NotificationChannel.SMS]
   * ```
   */
  getAvailableChannels(): NotificationChannel[] {
    const allChannels = Object.values(NotificationChannel);
    return allChannels.filter((channel) => this.hasChannelRoute(channel));
  }

  /**
   * Check if this entity can receive notifications via a specific channel
   * Alias for hasChannelRoute for better readability
   *
   * @param channel - The channel to check
   * @returns true if the entity can receive via this channel
   *
   * @example
   * ```typescript
   * if (user.canReceiveVia(NotificationChannel.PUSH)) {
   *   await sendPushNotification(user);
   * }
   * ```
   */
  canReceiveVia(channel: NotificationChannel): boolean {
    return this.hasChannelRoute(channel);
  }

  /**
   * Check if this entity has routing info for ALL specified channels
   * Useful when a notification requires multiple channels
   *
   * @param channels - Array of channels to check
   * @returns true if all channels have routing info
   *
   * @example
   * ```typescript
   * if (user.hasAllChannels([NotificationChannel.EMAIL, NotificationChannel.SMS])) {
   *   await user.notify(new MultiChannelNotification(), manager);
   * }
   * ```
   */
  hasAllChannels(channels: NotificationChannel[]): boolean {
    return channels.every((channel) => this.hasChannelRoute(channel));
  }

  /**
   * Check if this entity has routing info for ANY of the specified channels
   * Useful for fallback scenarios
   *
   * @param channels - Array of channels to check
   * @returns true if at least one channel has routing info
   *
   * @example
   * ```typescript
   * if (user.hasAnyChannel([NotificationChannel.EMAIL, NotificationChannel.SMS])) {
   *   await user.notify(notification, manager);
   * }
   * ```
   */
  hasAnyChannel(channels: NotificationChannel[]): boolean {
    return channels.some((channel) => this.hasChannelRoute(channel));
  }

  /**
   * Get a user-friendly identifier for this entity
   * Returns the notification name if available, otherwise 'Unknown'
   *
   * @returns Display identifier
   */
  getIdentifier(): string {
    return this.getNotificationName?.() || 'Unknown';
  }
}
