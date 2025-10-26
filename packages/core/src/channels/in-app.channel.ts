import { BaseNotificationChannel } from '../core/base-notification-channel';
import { IInAppChannel } from '../interfaces/notification-channel.interface';
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
import { NotificationChannelConfig } from '../interfaces/notification-config.interface';
import { NotificationChannel } from '../types';
import { NotificationChannelException } from '../exceptions';

/**
 * Base class for in-app/database notification channel implementations
 */
export abstract class InAppChannel extends BaseNotificationChannel implements IInAppChannel {
  constructor(config: NotificationChannelConfig, channelName: string) {
    super(config, channelName, NotificationChannel.IN_APP);
  }

  /**
   * Abstract method to send an in-app notification
   */
  abstract sendInApp(request: SendInAppRequest): Promise<SendInAppResponse>;

  /**
   * Send implementation that delegates to sendInApp
   */
  async send(
    notification: SendEmailRequest | SendSmsRequest | SendPushRequest | SendInAppRequest,
  ): Promise<SendEmailResponse | SendSmsResponse | SendPushResponse | SendInAppResponse> {
    if (this.isInAppRequest(notification)) {
      return this.sendInApp(notification);
    }

    throw new NotificationChannelException(
      `${this.channelName} only supports in-app notifications`,
      'UNSUPPORTED_NOTIFICATION_TYPE',
      { receivedType: typeof notification },
    );
  }

  /**
   * Type guard to check if notification is an in-app request
   */
  private isInAppRequest(
    notification: SendEmailRequest | SendSmsRequest | SendPushRequest | SendInAppRequest,
  ): notification is SendInAppRequest {
    return (
      'title' in notification &&
      'message' in notification &&
      'to' in notification &&
      !('body' in notification) &&
      !('subject' in notification)
    );
  }
}
