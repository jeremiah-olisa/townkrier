import { NotificationEventDispatcher } from '../../events';
import { INotificationChannel, ChannelConfig, ChannelFactory } from '../../interfaces';
export { Constructor } from '../../utils';

/**
 * Interface defining the base properties required by the NotificationManager mixins
 * This ensures that mixins can rely on these properties being present
 */
export interface INotificationManagerBase<T extends string = string> {
  channels: Map<T, INotificationChannel>;
  channelAdapters: Map<string, INotificationChannel[]>;
  factories: Map<string, ChannelFactory>;
  channelConfigs: Map<string, ChannelConfig>;
  defaultChannel?: T;
  enableFallback: boolean;
  eventDispatcher?: NotificationEventDispatcher;

  getChannel(name: T): INotificationChannel;
  getAvailableChannels(): T[];
  // Re-declare internal private methods as public/protected for mixin access if needed,
  // or use an abstract class base if strict protected access is required.
  // For Composition via Mixins in TS, interfaces are key.
}

/**
 * Interface for the Channel Manager Mixin
 */
export interface IChannelManager<T extends string = string> {
  registerFactory<Config = unknown>(name: T, factory: ChannelFactory<Config>): this;
  registerChannel(name: T, channel: INotificationChannel): this;
  getChannel(name: T): INotificationChannel;
  getDefaultChannel(): INotificationChannel;
  getChannelWithFallback(preferredChannel?: T): INotificationChannel | null;
  getAvailableChannels(): T[];
  getReadyChannels(): T[];
  hasChannel(name: T): boolean;
  isChannelReady(name: T): boolean;
  setDefaultChannel(name: T): this;
  setFallbackEnabled(enabled: boolean): this;
  removeChannel(name: T): this;
  clear(): this;
}

/**
 * Interface for the Request Builder Mixin
 */
export interface IRequestBuilder {
  buildRequest(notification: any, channelType: string, recipient: any): any | null;
}

/**
 * Interface for the Notification Sender Mixin
 */
export interface INotificationSender<T extends string = string> {
  sendWithAdapterFallback(channelName: T, request: any): Promise<any>;
  send(notification: any, recipient: any): Promise<Map<T, unknown>>;
}

/**
 * Combined Interface for Notification Manager
 */
export interface INotificationManager<T extends string = string>
  extends INotificationManagerBase<T>,
    IChannelManager<T>,
    IRequestBuilder,
    INotificationSender<T> {}
