import { Notification } from '../notification';
import { NotificationChannel, NotificationChannelType } from '../../types';
import { NotificationManager } from '../notification-manager';
import { NotificationRecipient } from '../../interfaces';
import { notify } from './utils';
import { Constructor } from '../../utils';
import { NotificationResult } from '../../interfaces';

/**
 * Interface definition for what the Mixin adds
 * This is needed for TypeScript to recognize the added methods
 */
export interface INotifiable {
  routeNotificationFor(channel: NotificationChannelType): string | string[] | unknown;
  getNotificationName?(): string;
  setNotificationManager(manager: NotificationManager): this;
  getNotificationManager(): NotificationManager | undefined;
  notify(notification: Notification, manager?: NotificationManager): Promise<NotificationResult>;
  toRecipient(
    channels?: NotificationChannelType[],
    notification?: Notification,
  ): NotificationRecipient;
  hasChannelRoute(channel: NotificationChannelType): boolean;
  getAvailableChannels(): NotificationChannelType[];
  canReceiveVia(channel: NotificationChannelType): boolean;
  hasAllChannels(channels: NotificationChannelType[]): boolean;
  hasAnyChannel(channels: NotificationChannelType[]): boolean;
  getIdentifier(): string;
}

/**
 * Notifiable Mixin
 * Enables any class to become "Notifiable" (send/receive notifications)
 *
 * @example
 * ```typescript
 * class User extends NotifiableMixin(BaseEntity) { ... }
 * ```
 */
export function NotifiableMixin<TBase extends Constructor>(Base: TBase) {
  abstract class Notifiable extends Base implements INotifiable {
    /**
     * Optional notification manager injected into this entity
     */
    public notificationManager?: NotificationManager;

    /**
     * Get the notification routing information for the given channel
     * Must be implemented by the consuming class
     */
    abstract routeNotificationFor(channel: NotificationChannelType): string | string[] | unknown;

    /**
     * Get the preferred display name for this notifiable entity
     * Can be implemented by the consuming class
     */
    getNotificationName?(): string;

    /**
     * Set or update the notification manager for this entity
     */
    setNotificationManager(manager: NotificationManager): this {
      this.notificationManager = manager;
      return this;
    }

    /**
     * Get the current notification manager
     */
    getNotificationManager(): NotificationManager | undefined {
      return this.notificationManager;
    }

    /**
     * Send a notification to this entity
     */
    notify(notification: Notification, manager?: NotificationManager): Promise<NotificationResult> {
      const managerToUse = manager || this.notificationManager;

      if (!managerToUse) {
        throw new Error(
          'No notification manager available. Either pass a manager explicitly or inject one via constructor/setNotificationManager()',
        );
      }

      // We need to pass 'this' as the recipient only if 'this' satisfies the expected type for notify
      // Since 'this' is Notifiable, it should work.
      // However, notify() function expects { routeNotificationFor: ... }
      // Casting strictness might be an issue, let's see.
      return notify(this as unknown as INotifiable, notification, managerToUse);
    }

    /**
     * Build a NotificationRecipient object
     */
    toRecipient(
      channels?: NotificationChannelType[],
      notification?: Notification,
    ): NotificationRecipient {
      const channelsToUse = channels || notification?.via() || [];
      const recipient: NotificationRecipient = {};

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
     */
    hasChannelRoute(channel: NotificationChannelType): boolean {
      const route = this.routeNotificationFor(channel);
      return route !== undefined && route !== null && route !== '';
    }

    /**
     * Get all available channels for this entity
     */
    getAvailableChannels(): NotificationChannelType[] {
      const allChannels = Object.values(NotificationChannel);
      return allChannels.filter((channel) => this.hasChannelRoute(channel));
    }

    /**
     * Check if this entity can receive notifications via a specific channel
     */
    canReceiveVia(channel: NotificationChannelType): boolean {
      return this.hasChannelRoute(channel);
    }

    /**
     * Check if this entity has routing info for ALL specified channels
     */
    hasAllChannels(channels: NotificationChannelType[]): boolean {
      return channels.every((channel) => this.hasChannelRoute(channel));
    }

    /**
     * Check if this entity has routing info for ANY of the specified channels
     */
    hasAnyChannel(channels: NotificationChannelType[]): boolean {
      return channels.some((channel) => this.hasChannelRoute(channel));
    }

    /**
     * Get a user-friendly identifier for this entity
     */
    getIdentifier(): string {
      return this.getNotificationName?.() || 'Unknown';
    }
  }

  return Notifiable;
}
