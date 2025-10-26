import { INotificationChannel } from '../interfaces/notification-channel.interface';
import { NotificationChannelConfig } from '../interfaces/notification-config.interface';
import { NotificationConfigurationException } from '../exceptions';
import {
  SendEmailRequest,
  SendEmailResponse,
  SendSmsRequest,
  SendSmsResponse,
  SendPushRequest,
  SendPushResponse,
  SendInAppRequest,
  SendInAppResponse,
} from '../interfaces';
import { NotificationChannel } from '../types';

/**
 * Abstract base class for notification channel implementations
 */
export abstract class BaseNotificationChannel implements INotificationChannel {
  protected config: NotificationChannelConfig;
  protected channelName: string;
  protected channelType: NotificationChannel;

  constructor(
    config: NotificationChannelConfig,
    channelName: string,
    channelType: NotificationChannel,
  ) {
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
  getChannelType(): NotificationChannel {
    return this.channelType;
  }

  /**
   * Check if the channel is ready
   */
  isReady(): boolean {
    return !!(this.config.apiKey || this.config.secretKey);
  }

  /**
   * Send a notification through this channel
   */
  abstract send(
    notification:
      | SendEmailRequest
      | SendSmsRequest
      | SendPushRequest
      | SendInAppRequest,
  ): Promise<
    | SendEmailResponse
    | SendSmsResponse
    | SendPushResponse
    | SendInAppResponse
  >;
}
