import { NotificationDriver, Notifiable } from './interfaces/driver.interface';
import { TownkrierConfig } from './interfaces/townkrier-config.interface';
import { Notification } from './notification';
import {
  NotificationEventDispatcher,
  NotificationSending,
  NotificationSent,
  NotificationFailed,
} from './events';
import { DeliveryStrategy, NotificationResult } from './types/delivery-strategy.type';
import { Logger } from './logger';
import { CompositeFallbackDriver } from './drivers/composite-fallback.driver';
import { NotificationConfigurationException, NotificationSendException } from './exceptions';
import { FallbackStrategy } from './types/fallback-strategy.enum'; // Import the enum
import { ChannelConfig, FallbackStrategyConfig } from './interfaces';
import { DriverEntry } from './drivers/driver-entry.interface';

/**
 * The core orchestrator for sending notifications.
 * Manages channel configurations, driver instantiation, and the sending workflow.
 *
 * @template ChannelNames - String literal union of valid channel names.
 */
export class NotificationManager<ChannelNames extends string = string> {
  private drivers: Map<string, NotificationDriver> = new Map();
  private eventDispatcher: NotificationEventDispatcher;

  /**
   * Creates a new NotificationManager instance.
   *
   * @param config - The Townkrier configuration object.
   */
  constructor(private config: TownkrierConfig<ChannelNames>) {
    this.eventDispatcher = new NotificationEventDispatcher();
    this.boot();
  }

  /**
   * Initialize drivers from configuration.
   * Internal method called during construction.
   */
  private boot() {
    for (const key of Object.keys(this.config.channels)) {
      const channelName = key as ChannelNames;
      const channelConfig = this.config.channels[channelName];
      this.registerChannel(channelName, channelConfig);
    }
  }

  private registerChannel(name: ChannelNames, config: ChannelConfig | FallbackStrategyConfig) {
    if ('driver' in config) {
      this.registerSingleDriver(name, config as ChannelConfig);
    } else if ('strategy' in config && Object.values(FallbackStrategy).includes(config.strategy)) {
      this.registerFallbackStrategy(name, config as FallbackStrategyConfig);
    }
  }

  private registerSingleDriver(name: ChannelNames, config: ChannelConfig) {
    try {
      const { driver: DriverClass, config: driverConfig } = config;
      const instance = new DriverClass(driverConfig);
      this.drivers.set(name, instance);
      Logger.debug(`Registered single driver for channel: ${name}`);
    } catch (error) {
      Logger.error(`Failed to register driver for channel ${name}`, error);
      throw new NotificationConfigurationException(
        `Failed to register driver for channel ${name}`,
        error,
      );
    }
  }

  private registerFallbackStrategy(name: ChannelNames, config: FallbackStrategyConfig) {
    if (!config.drivers || config.drivers.length === 0) {
      throw new NotificationConfigurationException(
        `No drivers configured for fallback channel ${name}`,
      );
    }

    try {
      const driverEntries: DriverEntry[] = config.drivers.map((driverConfig, index) => {
        try {
          const DriverClass = driverConfig.use;
          const instance = new DriverClass(driverConfig.config);
          return {
            driver: instance,
            priority: driverConfig.priority ?? config.drivers.length - index, // Default priority by order
            weight: driverConfig.weight,
            retryConfig: driverConfig.retryConfig,
            enabled: driverConfig.enabled,
          };
        } catch (error) {
          Logger.error(`Failed to instantiate driver ${index} for channel ${name}`, error);
          throw new NotificationConfigurationException(
            `Failed to instantiate driver ${index} for channel ${name}`,
            error,
          );
        }
      });

      const compositeDriver = new CompositeFallbackDriver(driverEntries, config.strategy);
      this.drivers.set(name, compositeDriver);
      Logger.debug(
        `Registered ${config.strategy} strategy for channel: ${name} with ${driverEntries.length} drivers`,
      );
    } catch (error) {
      Logger.error(`Failed to register fallback strategy for channel ${name}`, error);
      if (error instanceof NotificationConfigurationException) throw error;
      throw new NotificationConfigurationException(
        `Failed to register fallback strategy for channel ${name}`,
        error,
      );
    }
  }

  /**
   * Get a driver instance by name
   */
  public driver(name: ChannelNames | string): NotificationDriver | undefined {
    return this.drivers.get(name);
  }

  /**
   * Get the event dispatcher instance
   */
  public events(): NotificationEventDispatcher {
    return this.eventDispatcher;
  }

  /**
   * Sends the given notification to the given notifiable entity.
   * Iterates through channels returned by `notification.via()`, resolves the appropriate driver,
   * calls the message building method (e.g. `toEmail`), and dispatches the message.
   *
   * @param notifiable - The entity to notify.
   * @param notification - The notification instance to send.
   * @returns A promise that resolves to the final NotificationResult.
   */
  public async send(
    notifiable: Notifiable,
    notification: Notification<ChannelNames>,
  ): Promise<NotificationResult> {
    const channels = notification.via(notifiable);
    const results: Map<string, unknown> = new Map();
    const errors: Map<string, Error> = new Map();
    const strategy = this.config.strategy || DeliveryStrategy.AllOrNothing;

    await this.eventDispatcher.dispatch(new NotificationSending(notification, channels as any[]));

    for (const channelName of channels) {
      try {
        const result = await this.processChannel(channelName, notifiable, notification);
        results.set(channelName, result);
      } catch (error: any) {
        errors.set(channelName, error);
        Logger.error(`Failed to send via ${channelName}:`, error);

        if (this.shouldAbortOnFailure(strategy)) {
          await this.dispatchFailure(notification, channels, error, channelName);
          return { status: 'failed', results, errors };
        }
      }
    }

    return this.finalizeResult(notification, channels, results, errors);
  }

  /**
   * Process a single channel delivery
   */
  private async processChannel(
    channelName: ChannelNames,
    notifiable: Notifiable,
    notification: Notification<ChannelNames>,
  ): Promise<unknown> {
    const driver = this.resolveDriver(channelName);
    const message = this.buildMessage(channelName, notification, notifiable);

    // The CompositeFallbackDriver handles its own retry logic
    // For single drivers, we could add circuit breaker here if needed
    const result = await driver.send(notifiable, message);

    if (result.status !== 'success') {
      throw (
        result.error || new NotificationSendException(`Driver refused delivery: ${result.status}`)
      );
    }

    return result.response;
  }

  /**
   * Resolve the driver for a channel
   */
  private resolveDriver(channelName: ChannelNames): NotificationDriver {
    const driver = this.drivers.get(channelName);
    if (!driver) {
      throw new NotificationConfigurationException(
        `Driver for channel '${channelName}' not configured.`,
      );
    }
    return driver;
  }

  /**
   * Build the message object for the channel
   */
  private buildMessage(
    channelName: string,
    notification: Notification<ChannelNames>,
    notifiable: Notifiable,
  ): any {
    const normalizedName = channelName
      .split(/[-_]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
    const methodName = `to${normalizedName}`;
    const messageBuilder = (notification as any)[methodName];

    if (typeof messageBuilder !== 'function') {
      throw new NotificationConfigurationException(
        `Notification is missing method '${methodName}' for channel '${channelName}'`,
      );
    }

    return messageBuilder.call(notification, notifiable);
  }

  /**
   * Check if we should abort sending based on strategy
   */
  private shouldAbortOnFailure(strategy: DeliveryStrategy): boolean {
    return strategy === DeliveryStrategy.AllOrNothing;
  }

  /**
   * Finalize the notification result and dispatch appropriate events
   */
  private async finalizeResult(
    notification: Notification<ChannelNames>,
    channels: ChannelNames[],
    results: Map<string, unknown>,
    errors: Map<string, Error>,
  ): Promise<NotificationResult> {
    const hasErrors = errors.size > 0;
    const hasSuccess = results.size > 0;

    let status: 'success' | 'partial' | 'failed' = 'failed';
    if (!hasErrors) status = 'success';
    else if (hasSuccess) status = 'partial';

    if (status === 'success' || status === 'partial') {
      await this.eventDispatcher.dispatch(
        new NotificationSent(notification, channels as any[], results),
      );
    } else {
      const firstError =
        errors.values().next().value || new NotificationSendException('Unknown failure');
      await this.dispatchFailure(notification, channels, firstError);
    }

    return { status, results, errors };
  }

  private async dispatchFailure(
    notification: Notification<ChannelNames>,
    channels: ChannelNames[],
    error: Error,
    failedChannel?: ChannelNames,
  ) {
    await this.eventDispatcher.dispatch(
      new NotificationFailed(notification, channels as any[], error, failedChannel as any),
    );
  }
}
