import { IEmailChannel } from '../interfaces/notification-channel.interface';
import { BaseNotificationChannel } from '../core/base-notification-channel';
import { SendEmailRequest, SendEmailResponse } from '../interfaces';
import { NotificationChannel } from '../types';
import { NotificationChannelConfig } from '../interfaces';

/**
 * Abstract base class for email channel implementations
 */
export abstract class MailChannel extends BaseNotificationChannel implements IEmailChannel {
  constructor(config: NotificationChannelConfig, channelName: string) {
    super(config, channelName, NotificationChannel.EMAIL);
  }

  /**
   * Send an email notification
   */
  abstract sendEmail(request: SendEmailRequest): Promise<SendEmailResponse>;

  /**
   * Send method implementation that delegates to sendEmail
   */
  async send(notification: SendEmailRequest): Promise<SendEmailResponse> {
    return this.sendEmail(notification);
  }
}
