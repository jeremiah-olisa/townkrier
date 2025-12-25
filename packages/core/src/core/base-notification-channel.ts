import { INotificationChannel } from '../interfaces/notification-channel.interface';
import { NotificationChannelConfig } from '../interfaces/notification-config.interface';
import { NotificationConfigurationException } from '../exceptions';

/**
 * Abstract base class for notification channel implementations
 */
/**
 * Abstract base class for notification channel implementations
 * @template TConfig Configuration type for the channel
 * @template TRequest Notification request type supporting this channel
 * @template TResponse Response type from this channel
 */
export abstract class BaseNotificationChannel<
  TConfig extends NotificationChannelConfig = NotificationChannelConfig,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TRequest = any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TResponse = any,
> implements INotificationChannel
{
  protected config: TConfig;
  protected channelName: string;
  protected channelType: string;

  constructor(config: TConfig, channelName: string, channelType: string) {
    this.config = config;
    this.channelName = channelName;
    this.channelType = channelType;
    this.validateConfig();
  }

  /**
   * Validate channel configuration
   * @throws {NotificationConfigurationException} If configuration is invalid
   */
  protected validateConfig(): void {
    if (!this.config.apiKey && !this.config.secretKey) {
      throw new NotificationConfigurationException(
        `${this.channelName}: API key or secret key is required`,
        {
          channelName: this.channelName,
        },
      );
    }
  }

  /**
   * Get the channel name
   */
  getChannelName(): string {
    return this.channelName;
  }

  /**
   * Get the channel type
   */
  getChannelType(): string {
    return this.channelType;
  }

  /**
   * Check if the channel is ready
   */
  isReady(): boolean {
    return !!(this.config.apiKey || this.config.secretKey);
  }

  /**
   * Send a notification through this channel (Generic Interface implementation)
   * Delegates to sendTyped after casting
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract send(notification: TRequest): Promise<TResponse>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected abstract isValidNotificationRequest(notification: any): notification is TRequest;
}
