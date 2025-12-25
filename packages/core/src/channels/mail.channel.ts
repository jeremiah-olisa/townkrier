import { BaseNotificationChannel } from '../core/base-notification-channel';
import { IEmailChannel } from '../interfaces/notification-channel.interface';
import { SendEmailRequest, SendEmailResponse } from '../interfaces';
import { NotificationChannelConfig } from '../interfaces/notification-config.interface';
import { NotificationChannel } from '../types';
import { NotificationChannelException } from '../exceptions';

/**
 * Base class for email channel implementations
 */
export interface MailChannelOptions {
  failSilently?: boolean;
}

/**
 * Base class for email channel implementations
 */
export abstract class MailChannel
  extends BaseNotificationChannel<NotificationChannelConfig, SendEmailRequest, SendEmailResponse>
  implements IEmailChannel
{
  protected options: MailChannelOptions;

  constructor(
    config: NotificationChannelConfig,
    channelName: string,
    options: MailChannelOptions = { failSilently: true },
  ) {
    super(config, channelName, NotificationChannel.EMAIL);
    this.options = options;
  }

  /**
   * Abstract method to send an email
   */
  abstract sendEmail(request: SendEmailRequest): Promise<SendEmailResponse>;

  /**
   * Send implementation that delegates to sendEmail
   */
  async send(notification: SendEmailRequest): Promise<SendEmailResponse> {
    if (this.isValidNotificationRequest(notification)) {
      return this.sendEmail(notification);
    }

    const error = new NotificationChannelException(
      `${this.channelName} only supports email notifications`,
      'UNSUPPORTED_NOTIFICATION_TYPE',
      { receivedType: typeof notification },
    );

    if (this.options.failSilently) {
      // Log the error (would be better with a proper logger, but using console for now as per base)
      if (this.config.debug) {
        console.error(error.message);
      }

      return {
        success: false,
        messageId: '',
        status: 'failed',
        error: {
          code: 'UNSUPPORTED_NOTIFICATION_TYPE',
          message: error.message,
        },
      } as SendEmailResponse;
    }

    throw error;
  }

  /**
   * Type guard to check if notification is an email request
   * Only checks for 'subject' and 'to' (not 'from', which can be set in channel config)
   * eslint-disable-next-line @typescript-eslint/no-explicit-any
   */
  protected isValidNotificationRequest(notification: any): notification is SendEmailRequest {
    return (
      notification &&
      typeof notification === 'object' &&
      'subject' in notification &&
      'to' in notification
    );
  }
}
