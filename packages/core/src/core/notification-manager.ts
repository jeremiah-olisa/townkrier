import { INotificationChannel } from '../interfaces/notification-channel.interface';
import {
  ChannelConfig,
  ChannelFactory,
  NotificationManagerConfig,
  ITemplateRenderer,
  CircuitBreakerConfig,
  CircuitBreakerState,
} from '../interfaces';
import { NotificationEventDispatcher } from '../events';
import { INotificationManagerBase } from './notification-manager/types';
import { ChannelManagerMixin } from './notification-manager/channel-manager.mixin';
import { RequestBuilderMixin } from './notification-manager/request-builder.mixin';
import { NotificationSenderMixin } from './notification-manager/notification-sender.mixin';
import { NotificationConfigurationException } from '../exceptions';

/**
 * Base Notification Manager class which holds the state
 */
/**
 * Base Notification Manager class which holds the state
 */
class BaseNotificationManager<TChannel extends string = string>
  implements INotificationManagerBase<TChannel>
{
  public readonly channels: Map<TChannel, INotificationChannel> = new Map();
  public readonly channelAdapters: Map<string, INotificationChannel[]> = new Map();
  public readonly factories: Map<string, ChannelFactory> = new Map();
  public readonly channelConfigs: Map<string, ChannelConfig> = new Map();
  public defaultChannel?: TChannel;
  public enableFallback: boolean = false;
  public strategy: 'all-or-nothing' | 'best-effort' = 'all-or-nothing';
  public eventDispatcher?: NotificationEventDispatcher;
  public renderer?: ITemplateRenderer;
  public circuitBreaker: Required<CircuitBreakerConfig>;
  public circuitBreakerState: Map<string, CircuitBreakerState> = new Map();

  constructor(config?: NotificationManagerConfig, eventDispatcher?: NotificationEventDispatcher) {
    const defaultCircuitBreaker: Required<CircuitBreakerConfig> = {
      enabled: false,
      failureThreshold: 3,
      cooldownMs: 30_000,
    };

    this.circuitBreaker = {
      ...defaultCircuitBreaker,
      ...(config?.circuitBreaker || {}),
    };

    if (config) {
      if (config.defaultChannel) {
        this.defaultChannel = config.defaultChannel as TChannel;
      }
      this.strategy = config.strategy || 'all-or-nothing';
      this.enableFallback = config.enableFallback ?? false;
      this.renderer = config.renderer;

      // Store channel configs for later initialization
      config.channels.forEach((channelConfig) => {
        this.channelConfigs.set(channelConfig.name, channelConfig);
      });
    }
    this.eventDispatcher = eventDispatcher;
  }

  // Placeholder methods to satisfy interface, implementing mixins will override
  getChannel(_name: TChannel): INotificationChannel {
    throw new NotificationConfigurationException('Method not implemented.');
  }

  getAvailableChannels(): TChannel[] {
    throw new NotificationConfigurationException('Method not implemented.');
  }

  setEventDispatcher(dispatcher: NotificationEventDispatcher): this {
    this.eventDispatcher = dispatcher;
    return this;
  }
}

import { INotificationManager } from './notification-manager/types';

/**
 * Notification Manager - Factory pattern for managing multiple notification channels
 * Composed using Mixins for better separation of concerns
 */
class _NotificationManager extends NotificationSenderMixin(
  RequestBuilderMixin(ChannelManagerMixin(BaseNotificationManager)),
) {}

export const NotificationManager = _NotificationManager as unknown as new <
  TChannel extends string = string,
>(
  config?: NotificationManagerConfig,
  eventDispatcher?: NotificationEventDispatcher,
) => INotificationManager<TChannel>;

export type NotificationManager<TChannel extends string = string> = INotificationManager<TChannel>;
