import { BaseNotificationChannel } from '../core/base-notification-channel';
import { IPushChannel } from '../interfaces/notification-channel.interface';
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
 * Base class for push notification channel implementations
 */
export abstract class PushChannel extends BaseNotificationChannel implements IPushChannel {
  constructor(config: NotificationChannelConfig, channelName: string) {
    super(config, channelName, NotificationChannel.PUSH);
  }

  /**
   * Abstract method to send a push notification
   */
  abstract sendPush(request: SendPushRequest): Promise<SendPushResponse>;

  /**
   * Send implementation that delegates to sendPush
   */
  async send(
    notification: SendEmailRequest | SendSmsRequest | SendPushRequest | SendInAppRequest,
  ): Promise<SendEmailResponse | SendSmsResponse | SendPushResponse | SendInAppResponse> {
    if (this.isPushRequest(notification)) {
      return this.sendPush(notification);
    }

    throw new NotificationChannelException(
      `${this.channelName} only supports push notifications`,
      'UNSUPPORTED_NOTIFICATION_TYPE',
      { receivedType: typeof notification },
    );
  }

  /**
   * Type guard to check if notification is a push request
   */
  private isPushRequest(
    notification: SendEmailRequest | SendSmsRequest | SendPushRequest | SendInAppRequest,
  ): notification is SendPushRequest {
    return 'title' in notification && 'body' in notification && 'to' in notification;
  }
}
