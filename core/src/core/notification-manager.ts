import { INotificationChannel } from '../interfaces/notification-channel.interface';
import { NotificationConfigurationException } from '../exceptions';
import {
  ChannelConfig,
  ChannelEnvConfig,
  ChannelFactory,
  NotificationManagerConfig,
} from '../interfaces';

/**
 * Notification Manager - Factory pattern for managing multiple notification channels
 */
export class NotificationManager {
  private readonly channels: Map<string, INotificationChannel> = new Map();
  private readonly factories: Map<string, ChannelFactory> = new Map();
  private readonly channelConfigs: Map<string, ChannelConfig> = new Map();
  private defaultChannel?: string;
  private enableFallback: boolean = false;

  constructor(config?: NotificationManagerConfig) {
    if (config) {
      this.defaultChannel = config.defaultChannel;
      this.enableFallback = config.enableFallback ?? false;

      // Store channel configs for later initialization
      config.channels.forEach((channelConfig) => {
        this.channelConfigs.set(channelConfig.name, channelConfig);
      });
    }
  }

  /**
   * Register a channel factory
   * @param name - Name of the channel (e.g., 'email-resend', 'sms-termii')
   * @param factory - Factory function to create the channel instance
   */
  registerFactory<T = ChannelEnvConfig>(name: string, factory: ChannelFactory<T>): this {
    this.factories.set(name.toLowerCase(), factory as ChannelFactory<ChannelEnvConfig>);

    // If we have a config for this channel, initialize it
    const config = this.channelConfigs.get(name.toLowerCase());
    if (config && config.enabled !== false) {
      try {
        const channel = factory(config.config as T) as INotificationChannel;
        this.channels.set(name.toLowerCase(), channel);
      } catch (error) {
        console.error(`Failed to initialize channel '${name}':`, error);
      }
    }

    return this;
  }

  /**
   * Register a channel instance directly
   * @param name - Name of the channel
   * @param channel - Channel instance
   */
  registerChannel(name: string, channel: INotificationChannel): this {
    this.channels.set(name.toLowerCase(), channel);
    return this;
  }

  /**
   * Get a specific channel by name
   * @param name - Name of the channel
   * @throws {NotificationConfigurationException} If channel not found
   */
  getChannel(name: string): INotificationChannel {
    const channel = this.channels.get(name.toLowerCase());

    if (!channel) {
      throw new NotificationConfigurationException(
        `Notification channel '${name}' is not registered or enabled`,
        {
          channelName: name,
          availableChannels: Array.from(this.channels.keys()),
        },
      );
    }

    if (!channel.isReady()) {
      throw new NotificationConfigurationException(
        `Notification channel '${name}' is not ready. Please check configuration.`,
        {
          channelName: name,
        },
      );
    }

    return channel;
  }

  /**
   * Get the default channel
   * @throws {NotificationConfigurationException} If no default channel configured
   */
  getDefaultChannel(): INotificationChannel {
    if (!this.defaultChannel) {
      // Try to get the first available channel
      const firstChannel = this.channels.values().next().value;
      if (firstChannel) {
        return firstChannel;
      }

      throw new NotificationConfigurationException(
        'No default channel configured and no channels available',
        {
          availableChannels: Array.from(this.channels.keys()),
        },
      );
    }

    return this.getChannel(this.defaultChannel);
  }

  /**
   * Get a channel with fallback support
   * @param preferredChannel - Preferred channel name (optional)
   * @returns Channel instance or null if no channel available
   */
  getChannelWithFallback(preferredChannel?: string): INotificationChannel | null {
    // Try preferred channel first
    if (preferredChannel) {
      try {
        const channel = this.getChannel(preferredChannel);
        if (channel.isReady()) {
          return channel;
        }
      } catch (error) {
        if (!this.enableFallback) {
          throw error;
        }
        console.warn(`Preferred channel '${preferredChannel}' not available, trying fallback`);
      }
    }

    // Try default channel
    if (this.defaultChannel && (!preferredChannel || preferredChannel !== this.defaultChannel)) {
      try {
        const channel = this.getChannel(this.defaultChannel);
        if (channel.isReady()) {
          return channel;
        }
      } catch (error) {
        if (!this.enableFallback) {
          throw error;
        }
        console.warn(`Default channel '${this.defaultChannel}' not available, trying fallback`);
      }
    }

    // Try to find any available channel (sorted by priority if configured)
    if (this.enableFallback) {
      const sortedChannels = this.getSortedChannels();
      for (const [name, channel] of sortedChannels) {
        if (channel.isReady() && name !== preferredChannel && name !== this.defaultChannel) {
          console.warn(`Using fallback channel: ${name}`);
          return channel;
        }
      }
    }

    return null;
  }

  /**
   * Get all registered channel names
   */
  getAvailableChannels(): string[] {
    return Array.from(this.channels.keys());
  }

  /**
   * Get all ready channel names
   */
  getReadyChannels(): string[] {
    return Array.from(this.channels.entries())
      .filter(([, channel]) => channel.isReady())
      .map(([name]) => name);
  }

  /**
   * Check if a channel is registered
   */
  hasChannel(name: string): boolean {
    return this.channels.has(name.toLowerCase());
  }

  /**
   * Check if a channel is ready
   */
  isChannelReady(name: string): boolean {
    const channel = this.channels.get(name.toLowerCase());
    return channel ? channel.isReady() : false;
  }

  /**
   * Set the default channel
   */
  setDefaultChannel(name: string): this {
    if (!this.hasChannel(name)) {
      throw new NotificationConfigurationException(
        `Cannot set '${name}' as default channel. Channel not registered.`,
        {
          channelName: name,
          availableChannels: this.getAvailableChannels(),
        },
      );
    }

    this.defaultChannel = name.toLowerCase();
    return this;
  }

  /**
   * Enable or disable fallback support
   */
  setFallbackEnabled(enabled: boolean): this {
    this.enableFallback = enabled;
    return this;
  }

  /**
   * Remove a channel
   */
  removeChannel(name: string): this {
    this.channels.delete(name.toLowerCase());
    this.factories.delete(name.toLowerCase());
    this.channelConfigs.delete(name.toLowerCase());

    if (this.defaultChannel === name.toLowerCase()) {
      this.defaultChannel = undefined;
    }

    return this;
  }

  /**
   * Clear all channels
   */
  clear(): this {
    this.channels.clear();
    this.factories.clear();
    this.channelConfigs.clear();
    this.defaultChannel = undefined;
    return this;
  }

  /**
   * Get channels sorted by priority
   */
  private getSortedChannels(): Array<[string, INotificationChannel]> {
    return Array.from(this.channels.entries()).sort((a, b) => {
      const configA = this.channelConfigs.get(a[0]);
      const configB = this.channelConfigs.get(b[0]);
      const priorityA = configA?.priority ?? 0;
      const priorityB = configB?.priority ?? 0;
      return priorityB - priorityA; // Higher priority first
    });
  }
}
