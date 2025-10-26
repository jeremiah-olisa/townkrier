import { INotificationChannel } from '../interfaces/notification-channel.interface';
import { NotificationConfigurationException } from '../exceptions';
import {
  ChannelConfig,
  ChannelEnvConfig,
  ChannelFactory,
  NotificationManagerConfig,
  SendEmailRequest,
  SendSmsRequest,
  SendPushRequest,
  SendInAppRequest,
  SendEmailResponse,
  SendSmsResponse,
  SendPushResponse,
  SendInAppResponse,
} from '../interfaces';
import {
  NotificationEventDispatcher,
  NotificationSending,
  NotificationSent,
  NotificationFailed,
} from './notification-events';
import { Notification } from './notification';
import { NotificationChannel } from '../types';

/**
 * Notification Manager - Factory pattern for managing multiple notification channels
 */
export class NotificationManager {
  private readonly channels: Map<string, INotificationChannel> = new Map();
  private readonly channelAdapters: Map<string, INotificationChannel[]> = new Map();
  private readonly factories: Map<string, ChannelFactory> = new Map();
  private readonly channelConfigs: Map<string, ChannelConfig> = new Map();
  private defaultChannel?: string;
  private enableFallback: boolean = false;
  private eventDispatcher?: NotificationEventDispatcher;

  constructor(config?: NotificationManagerConfig, eventDispatcher?: NotificationEventDispatcher) {
    if (config) {
      this.defaultChannel = config.defaultChannel;
      this.enableFallback = config.enableFallback ?? false;

      // Store channel configs for later initialization
      config.channels.forEach((channelConfig) => {
        this.channelConfigs.set(channelConfig.name, channelConfig);
      });
    }
    this.eventDispatcher = eventDispatcher;
  }

  /**
   * Register a channel factory
   * @param name - Name of the channel/adapter (e.g., 'email-resend', 'sms-termii')
   * @param factory - Factory function to create the channel instance
   */
  registerFactory<T = ChannelEnvConfig>(name: string, factory: ChannelFactory<T>): this {
    this.factories.set(name.toLowerCase(), factory as ChannelFactory<ChannelEnvConfig>);

    // Try to initialize all matching channel configurations
    for (const [channelName, config] of this.channelConfigs.entries()) {
      if (config.enabled === false) continue;

      // Check if this factory matches a legacy config (backwards compatibility)
      if (channelName === name.toLowerCase() && config.config) {
        try {
          const channel = factory(config.config as T) as INotificationChannel;
          this.channels.set(name.toLowerCase(), channel);
        } catch (error) {
          console.error(`Failed to initialize channel '${name}':`, error);
        }
      }

      // Check if this factory matches any adapter in the new adapters array
      if (config.adapters && Array.isArray(config.adapters)) {
        const adaptersForChannel: INotificationChannel[] = [];

        // Sort adapters by priority (higher first)
        const sortedAdapters = [...config.adapters].sort(
          (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
        );

        for (const adapterConfig of sortedAdapters) {
          // Check if this factory matches this adapter
          const adapterKey = `${channelName}-${adapterConfig.name}`.toLowerCase();

          if (
            name.toLowerCase() === adapterKey ||
            name.toLowerCase() === adapterConfig.name.toLowerCase()
          ) {
            if (adapterConfig.enabled !== false) {
              try {
                const adapter = factory(adapterConfig.config as T) as INotificationChannel;
                adaptersForChannel.push(adapter);

                // Also register the adapter with its full key for direct access
                this.channels.set(adapterKey, adapter);
              } catch (error) {
                console.error(`Failed to initialize adapter '${adapterKey}':`, error);
              }
            }
          }
        }

        // Store all adapters for this channel
        if (adaptersForChannel.length > 0) {
          const existing = this.channelAdapters.get(channelName) || [];
          this.channelAdapters.set(channelName, [...existing, ...adaptersForChannel]);
        }
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
   * Send notification through a channel with adapter fallback support
   * If the channel has multiple adapters configured, they will be tried in priority order
   * @param channelName - Name of the channel
   * @param request - Notification request
   * @returns Response from the successful adapter
   * @throws Error if all adapters fail
   */
  async sendWithAdapterFallback(
    channelName: string,
    request: SendEmailRequest | SendSmsRequest | SendPushRequest | SendInAppRequest,
  ): Promise<SendEmailResponse | SendSmsResponse | SendPushResponse | SendInAppResponse> {
    const adapters = this.channelAdapters.get(channelName.toLowerCase());

    // If no adapters configured for this channel, try legacy single channel approach
    if (!adapters || adapters.length === 0) {
      const channel = this.getChannel(channelName);
      return await channel.send(request);
    }

    // Try each adapter in priority order
    const errors: Array<{ adapter: string; error: Error }> = [];

    for (const adapter of adapters) {
      if (!adapter.isReady()) {
        console.warn(`Adapter '${adapter.getChannelName()}' is not ready, trying next...`);
        continue;
      }

      try {
        const response = await adapter.send(request);
        // If we get here, the send was successful
        return response;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        errors.push({ adapter: adapter.getChannelName(), error: err });
        console.warn(
          `Adapter '${adapter.getChannelName()}' failed: ${err.message}, trying next adapter...`,
        );
      }
    }

    // All adapters failed, throw comprehensive error
    const errorMessages = errors.map((e) => `${e.adapter}: ${e.error.message}`).join('; ');
    throw new NotificationConfigurationException(
      `All adapters failed for channel '${channelName}': ${errorMessages}`,
      {
        channelName,
        attemptedAdapters: errors.map((e) => e.adapter),
        errors: errors.map((e) => e.error.message),
      },
    );
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

  /**
   * Set the event dispatcher
   */
  setEventDispatcher(dispatcher: NotificationEventDispatcher): this {
    this.eventDispatcher = dispatcher;
    return this;
  }

  /**
   * Send a notification through specified channels
   * @param notification - The notification to send
   * @param recipient - The recipient's routing information
   */
  async send(
    notification: Notification,
    recipient: Record<NotificationChannel, unknown>,
  ): Promise<Map<NotificationChannel, unknown>> {
    const channels = notification.via();
    const responses = new Map<NotificationChannel, unknown>();

    // Dispatch sending event
    if (this.eventDispatcher) {
      await this.eventDispatcher.dispatch(new NotificationSending(notification, channels));
    }

    try {
      for (const channelType of channels) {
        try {
          const request = this.buildRequest(notification, channelType, recipient);

          if (request) {
            // Check if this channel has multiple adapters configured
            const channelName = this.getChannelNameByType(channelType);

            let response;
            if (channelName && this.channelAdapters.has(channelName)) {
              // Use adapter fallback for channels with multiple adapters
              response = await this.sendWithAdapterFallback(channelName, request);
            } else {
              // Use legacy single channel approach
              const channel = this.getChannelByType(channelType);
              response = await channel.send(request);
            }

            responses.set(channelType, response);
          }
        } catch (error) {
          // Dispatch failed event for this channel
          if (this.eventDispatcher) {
            await this.eventDispatcher.dispatch(
              new NotificationFailed(
                notification,
                channels,
                error instanceof Error ? error : new Error(String(error)),
                channelType,
              ),
            );
          }

          // Re-throw if fallback is not enabled
          if (!this.enableFallback) {
            throw error;
          }
        }
      }

      // Dispatch sent event if at least one channel succeeded
      if (responses.size > 0 && this.eventDispatcher) {
        await this.eventDispatcher.dispatch(
          new NotificationSent(notification, channels, responses),
        );
      }

      return responses;
    } catch (error) {
      // Dispatch failed event
      if (this.eventDispatcher) {
        await this.eventDispatcher.dispatch(
          new NotificationFailed(
            notification,
            channels,
            error instanceof Error ? error : new Error(String(error)),
          ),
        );
      }
      throw error;
    }
  }

  /**
   * Get a channel by its type, with adapter fallback support
   * This will return the first available adapter for channels with multiple adapters
   */
  private getChannelByType(channelType: NotificationChannel): INotificationChannel {
    // First, check if there are multiple adapters for this channel type
    for (const [, adapters] of this.channelAdapters.entries()) {
      if (adapters.length > 0 && adapters[0].getChannelType() === channelType) {
        // Return the first (highest priority) ready adapter
        for (const adapter of adapters) {
          if (adapter.isReady()) {
            return adapter;
          }
        }
      }
    }

    // Fallback to legacy single channel approach
    for (const [, channel] of this.channels) {
      if (channel.getChannelType() === channelType) {
        return channel;
      }
    }

    throw new NotificationConfigurationException(`No channel found for type: ${channelType}`, {
      channelType,
      availableChannels: this.getAvailableChannels(),
    });
  }

  /**
   * Get the channel name for a given channel type
   * Used internally for adapter fallback routing
   */
  private getChannelNameByType(channelType: NotificationChannel): string | null {
    for (const [channelName, adapters] of this.channelAdapters.entries()) {
      if (adapters.length > 0 && adapters[0].getChannelType() === channelType) {
        return channelName;
      }
    }
    return null;
  }

  /**
   * Build a request object for a specific channel
   */
  private buildRequest(
    notification: Notification,
    channelType: NotificationChannel,
    recipient: Record<NotificationChannel, unknown>,
  ): SendEmailRequest | SendSmsRequest | SendPushRequest | SendInAppRequest | null {
    const routingInfo = recipient[channelType];

    switch (channelType) {
      case NotificationChannel.EMAIL:
        if (notification.toEmail) {
          const emailData = notification.toEmail();
          return {
            ...emailData,
            to: routingInfo,
            reference: notification.reference,
            metadata: notification.metadata,
            priority: notification.priority,
          } as SendEmailRequest;
        }
        break;

      case NotificationChannel.SMS:
        if (notification.toSms) {
          const smsData = notification.toSms();
          return {
            ...smsData,
            to: routingInfo,
            reference: notification.reference,
            metadata: notification.metadata,
            priority: notification.priority,
          } as SendSmsRequest;
        }
        break;

      case NotificationChannel.PUSH:
        if (notification.toPush) {
          const pushData = notification.toPush();
          return {
            ...pushData,
            to: routingInfo,
            reference: notification.reference,
            metadata: notification.metadata,
            priority: notification.priority,
          } as SendPushRequest;
        }
        break;

      case NotificationChannel.IN_APP:
        if (notification.toInApp) {
          const inAppData = notification.toInApp();
          return {
            ...inAppData,
            to: routingInfo,
            reference: notification.reference,
            metadata: notification.metadata,
            priority: notification.priority,
          } as SendInAppRequest;
        }
        break;

      default:
        return null;
    }

    return null;
  }
}
