import { ISmsChannel } from '../interfaces/notification-channel.interface';
import { BaseNotificationChannel } from '../core/base-notification-channel';
import { SendSmsRequest, SendSmsResponse } from '../interfaces';
import { NotificationChannel } from '../types';
import { NotificationChannelConfig } from '../interfaces';

/**
 * Abstract base class for SMS channel implementations
 */
export abstract class SmsChannel extends BaseNotificationChannel implements ISmsChannel {
  constructor(config: NotificationChannelConfig, channelName: string) {
    super(config, channelName, NotificationChannel.SMS);
  }

  /**
   * Send an SMS notification
   */
  abstract sendSms(request: SendSmsRequest): Promise<SendSmsResponse>;

  /**
   * Send method implementation that delegates to sendSms
   */
  async send(notification: SendSmsRequest): Promise<SendSmsResponse> {
    return this.sendSms(notification);
  }
}
