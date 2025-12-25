import {
  SendEmailRequest,
  SendSmsRequest,
  SendPushRequest,
  SendInAppRequest,
  NotificationRecipient,
} from '../../interfaces';
import { Notification } from '../notification';
import { NotificationChannel } from '../../types';
import { INotificationManagerBase } from './types';
import { Constructor } from '../../utils';

/**
 * Mixin for building request objects
 */
export function RequestBuilderMixin<
  TChannel extends string,
  TBase extends Constructor<INotificationManagerBase<TChannel>>,
>(Base: TBase) {
  return class RequestBuilder extends Base {
    /**
     * Build a request object for a specific channel
     * @internal
     * eslint-disable-next-line @typescript-eslint/no-explicit-any
     */
    public buildRequest(
      notification: Notification,
      channelType: string,
      recipient: NotificationRecipient,
    ): any | null {
      const routingInfo = recipient[channelType];

      switch (channelType) {
        case NotificationChannel.EMAIL:
          if (notification.toEmail) {
            const emailData = notification.toEmail();
            return {
              ...emailData,
              to: routingInfo,
              reference: notification.reference,
              metadata: notification.metadata,
              priority: notification.priority,
            } as SendEmailRequest;
          }
          break;

        case NotificationChannel.SMS:
          if (notification.toSms) {
            const smsData = notification.toSms();
            return {
              ...smsData,
              to: routingInfo,
              reference: notification.reference,
              metadata: notification.metadata,
              priority: notification.priority,
            } as SendSmsRequest;
          }
          break;

        case NotificationChannel.PUSH:
          if (notification.toPush) {
            const pushData = notification.toPush();
            return {
              ...pushData,
              to: routingInfo,
              reference: notification.reference,
              metadata: notification.metadata,
              priority: notification.priority,
            } as SendPushRequest;
          }
          break;

        case NotificationChannel.IN_APP:
          if (notification.toInApp) {
            const inAppData = notification.toInApp();
            return {
              ...inAppData,
              to: routingInfo,
              reference: notification.reference,
              metadata: notification.metadata,
              priority: notification.priority,
            } as SendInAppRequest;
          }
          break;

        default:
          // Try to find a matching "toXxx" method for custom channels
          // Capitalize first letter: 'slack' -> 'toSlack'
          const methodName = `to${channelType.charAt(0).toUpperCase() + channelType.slice(1)}`;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (typeof (notification as any)[methodName] === 'function') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const customData = (notification as any)[methodName]();
            return {
              ...customData,
              to: routingInfo,
              reference: notification.reference,
              metadata: notification.metadata,
              priority: notification.priority,
            };
          }
          return null;
      }

      return null;
    }
  };
}
