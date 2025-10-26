import { IPushChannel } from '../interfaces/notification-channel.interface';
import { BaseNotificationChannel } from '../core/base-notification-channel';
import { SendPushRequest, SendPushResponse } from '../interfaces';
import { NotificationChannel } from '../types';
import { NotificationChannelConfig } from '../interfaces';

/**
 * Abstract base class for push notification channel implementations
 */
export abstract class PushChannel extends BaseNotificationChannel implements IPushChannel {
  constructor(config: NotificationChannelConfig, channelName: string) {
    super(config, channelName, NotificationChannel.PUSH);
  }

  /**
   * Send a push notification
   */
  abstract sendPush(request: SendPushRequest): Promise<SendPushResponse>;

  /**
   * Send method implementation that delegates to sendPush
   */
  async send(notification: SendPushRequest): Promise<SendPushResponse> {
    return this.sendPush(notification);
  }
}
