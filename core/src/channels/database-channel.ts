import { IInAppChannel } from '../interfaces/notification-channel.interface';
import { BaseNotificationChannel } from '../core/base-notification-channel';
import { SendInAppRequest, SendInAppResponse } from '../interfaces';
import { NotificationChannel } from '../types';
import { NotificationChannelConfig } from '../interfaces';

/**
 * Abstract base class for in-app/database notification channel implementations
 */
export abstract class DatabaseChannel extends BaseNotificationChannel implements IInAppChannel {
  constructor(config: NotificationChannelConfig, channelName: string) {
    super(config, channelName, NotificationChannel.IN_APP);
  }

  /**
   * Send an in-app notification
   */
  abstract sendInApp(request: SendInAppRequest): Promise<SendInAppResponse>;

  /**
   * Send method implementation that delegates to sendInApp
   */
  async send(notification: SendInAppRequest): Promise<SendInAppResponse> {
    return this.sendInApp(notification);
  }
}
