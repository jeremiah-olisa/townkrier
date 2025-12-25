import { NotificationManager } from './notification-manager';
import { INotificationChannel } from '../interfaces/notification-channel.interface';
import { NotificationEventDispatcher } from '../events';

/**
 * Configuration for the Townkrier factory
 */
export interface TownkrierConfig {
  /**
   * List of initialized channels
   */
  channels: INotificationChannel[];

  /**
   * Default channel name
   */
  defaultChannel?: string;

  /**
   * Enable fallback support
   * @default false
   */
  enableFallback?: boolean;

  /**
   * Optional event dispatcher
   */
  eventDispatcher?: NotificationEventDispatcher;
}

/**
 * Factory helper for creating and configuring NotificationManager
 * Provides a "Laravel-like" simple setup experience
 */
export class TownkrierFactory {
  /**
   * Create a configured NotificationManager
   * @param config - Setup configuration
   */
  static create(config: TownkrierConfig): NotificationManager {
    const manager = new NotificationManager(
      {
        channels: [], // We'll register channels manually below
        defaultChannel: config.defaultChannel,
        enableFallback: config.enableFallback,
      },
      config.eventDispatcher,
    );

    // Register all provided channels
    config.channels.forEach((channel) => {
      manager.registerChannel(channel.getChannelName(), channel);
    });

    return manager;
  }

  /**
   * Helper to type-check channel configuration
   * Useful for "defineConfig" style exports
   */
  static configureChannel<T extends INotificationChannel>(channel: T): T {
    return channel;
  }
}
