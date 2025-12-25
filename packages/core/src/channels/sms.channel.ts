import { BaseNotificationChannel } from '../core/base-notification-channel';
import { ISmsChannel } from '../interfaces/notification-channel.interface';
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
 * Base class for SMS channel implementations
 */
export abstract class SmsChannel extends BaseNotificationChannel implements ISmsChannel {
  constructor(config: NotificationChannelConfig, channelName: string) {
    super(config, channelName, NotificationChannel.SMS);
  }

  /**
   * Abstract method to send an SMS
   */
  abstract sendSms(request: SendSmsRequest): Promise<SendSmsResponse>;

  /**
   * Send implementation that delegates to sendSms
   */
  async send(
    notification: SendEmailRequest | SendSmsRequest | SendPushRequest | SendInAppRequest,
  ): Promise<SendEmailResponse | SendSmsResponse | SendPushResponse | SendInAppResponse> {
    if (this.isValidNotificationRequest(notification)) {
      return this.sendSms(notification);
    }

    throw new NotificationChannelException(
      `${this.channelName} only supports SMS notifications`,
      'UNSUPPORTED_NOTIFICATION_TYPE',
      { receivedType: typeof notification },
    );
  }

  /**
   * Type guard to check if notification is an SMS request
   */
  /**
   * Check if the notification request is valid for this channel
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected isValidNotificationRequest(notification: any): notification is SendSmsRequest {
    return 'text' in notification && 'to' in notification && !('subject' in notification);
  }
}
