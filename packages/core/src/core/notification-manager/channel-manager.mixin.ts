import { INotificationChannel, ChannelEnvConfig, ChannelFactory } from '../../interfaces';
import { NotificationConfigurationException } from '../../exceptions';
import { Logger } from '../../logger';
import { Constructor, INotificationManagerBase } from './types';

/**
 * Mixin for managing notification channels
 */
/**
 * Mixin for managing notification channels
 */
export function ChannelManagerMixin<
  TChannel extends string,
  TBase extends Constructor<INotificationManagerBase<TChannel>>,
>(Base: TBase) {
  return class ChannelManager extends Base {
    /**
     * Generate a consistent adapter key from channel and adapter names
     * @internal
     */
    public getAdapterKey(channelName: string, adapterName: string): string {
      return `${channelName}-${adapterName}`.toLowerCase();
    }

    /**
     * Register a channel factory
     */
    registerFactory<T = ChannelEnvConfig>(name: TChannel, factory: ChannelFactory<T>): this {
      this.factories.set(name.toLowerCase(), factory as ChannelFactory<ChannelEnvConfig>);

      // Try to initialize all matching channel configurations
      for (const [channelName, config] of this.channelConfigs.entries()) {
        if (config.enabled === false) continue;

        // Check if this factory matches a legacy config (backwards compatibility)
        if (channelName === name.toLowerCase() && config.config) {
          try {
            const channel = factory(config.config as T) as INotificationChannel;
            this.channels.set(name.toLowerCase() as TChannel, channel);
          } catch (error) {
            Logger.error(`Failed to initialize channel '${name}':`, error);
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
            const adapterKey = this.getAdapterKey(channelName, adapterConfig.name);

            if (
              name.toLowerCase() === adapterKey ||
              name.toLowerCase() === adapterConfig.name.toLowerCase()
            ) {
              if (adapterConfig.enabled !== false) {
                try {
                  const adapter = factory(adapterConfig.config as T) as INotificationChannel;
                  adaptersForChannel.push(adapter);

                  // Also register the adapter with its full key for direct access
                  this.channels.set(adapterKey as TChannel, adapter);
                } catch (error) {
                  Logger.error(`Failed to initialize adapter '${adapterKey}':`, error);
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
     */
    registerChannel(name: TChannel, channel: INotificationChannel): this {
      this.channels.set(name.toLowerCase() as TChannel, channel);
      return this;
    }

    /**
     * Get a specific channel by name
     */
    getChannel(name: TChannel): INotificationChannel {
      const channel = this.channels.get(name.toLowerCase() as TChannel);

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
     */
    getChannelWithFallback(preferredChannel?: TChannel): INotificationChannel | null {
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
          Logger.warn(`Preferred channel '${preferredChannel}' not available, trying fallback`);
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
          Logger.warn(`Default channel '${this.defaultChannel}' not available, trying fallback`);
        }
      }

      // Try to find any available channel (sorted by priority if configured)
      if (this.enableFallback) {
        const sortedChannels = this.getSortedChannels();
        for (const [name, channel] of sortedChannels) {
          if (channel.isReady() && name !== preferredChannel && name !== this.defaultChannel) {
            Logger.warn(`Using fallback channel: ${name}`);
            return channel;
          }
        }
      }

      return null;
    }

    /**
     * Get all registered channel names
     */
    getAvailableChannels(): TChannel[] {
      return Array.from(this.channels.keys());
    }

    /**
     * Get all ready channel names
     */
    getReadyChannels(): TChannel[] {
      return Array.from(this.channels.entries())
        .filter(([, channel]) => channel.isReady())
        .map(([name]) => name as TChannel);
    }

    /**
     * Check if a channel is registered
     */
    hasChannel(name: TChannel): boolean {
      return this.channels.has(name.toLowerCase() as TChannel);
    }

    /**
     * Check if a channel is ready
     */
    isChannelReady(name: TChannel): boolean {
      const channel = this.channels.get(name.toLowerCase() as TChannel);
      return channel ? channel.isReady() : false;
    }

    /**
     * Set the default channel
     */
    setDefaultChannel(name: TChannel): this {
      if (!this.hasChannel(name)) {
        throw new NotificationConfigurationException(
          `Cannot set '${name}' as default channel. Channel not registered.`,
          {
            channelName: name,
            availableChannels: this.getAvailableChannels(),
          },
        );
      }

      this.defaultChannel = name.toLowerCase() as TChannel;
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
    removeChannel(name: TChannel): this {
      this.channels.delete(name.toLowerCase() as TChannel);
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
     * @internal
     */
    public getSortedChannels(): Array<[string, INotificationChannel]> {
      return Array.from(this.channels.entries()).sort((a, b) => {
        const configA = this.channelConfigs.get(a[0]);
        const configB = this.channelConfigs.get(b[0]);
        const priorityA = configA?.priority ?? 0;
        const priorityB = configB?.priority ?? 0;
        return priorityB - priorityA; // Higher priority first
      });
    }

    /**
     * Get a channel by its type, with adapter fallback support
     * @internal
     */
    public getChannelByType(channelType: string): INotificationChannel {
      // First, check if there are multiple adapters for this channel type
      for (const [, adapters] of this.channelAdapters.entries()) {
        if (adapters.length > 0 && adapters[0].getChannelType() === channelType) {
          // Adapters are pre-sorted by priority during registerFactory
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
     * @internal
     */
    public getChannelNameByType(channelType: string): string | null {
      for (const [channelName, adapters] of this.channelAdapters.entries()) {
        if (adapters.length > 0 && adapters[0].getChannelType() === channelType) {
          return channelName;
        }
      }
      return null;
    }
  };
}
