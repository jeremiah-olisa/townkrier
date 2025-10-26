import { BaseNotificationChannel } from '../core/base-notification-channel';
import { IEmailChannel } from '../interfaces/notification-channel.interface';
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
 * Base class for email channel implementations
 */
export abstract class MailChannel extends BaseNotificationChannel implements IEmailChannel {
  constructor(config: NotificationChannelConfig, channelName: string) {
    super(config, channelName, NotificationChannel.EMAIL);
  }

  /**
   * Abstract method to send an email
   */
  abstract sendEmail(request: SendEmailRequest): Promise<SendEmailResponse>;

  /**
   * Send implementation that delegates to sendEmail
   */
  async send(
    notification: SendEmailRequest | SendSmsRequest | SendPushRequest | SendInAppRequest,
  ): Promise<SendEmailResponse | SendSmsResponse | SendPushResponse | SendInAppResponse> {
    if (this.isEmailRequest(notification)) {
      return this.sendEmail(notification);
    }

    throw new NotificationChannelException(
      `${this.channelName} only supports email notifications`,
      'UNSUPPORTED_NOTIFICATION_TYPE',
      { receivedType: typeof notification },
    );
  }

  /**
   * Type guard to check if notification is an email request
   */
  private isEmailRequest(
    notification: SendEmailRequest | SendSmsRequest | SendPushRequest | SendInAppRequest,
  ): notification is SendEmailRequest {
    return 'subject' in notification && 'from' in notification;
  }
}
