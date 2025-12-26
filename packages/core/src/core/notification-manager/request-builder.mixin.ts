import { NotificationRecipient } from '../../interfaces';
import { NotificationConfigurationException } from '../../exceptions';
import { Notification } from '../notification';
import { NotificationChannel } from '../../types';
import { INotificationManagerBase } from './types';
import { Constructor } from '../../utils';
import { NotificationRequestMapper } from '../notification-request.mapper';

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
    public async buildRequest(
      notification: Notification,
      channelType: string,
      recipient: NotificationRecipient,
    ): Promise<any | null> {
      const routingInfo = recipient[channelType];

      switch (channelType) {
        case NotificationChannel.EMAIL:
          if (notification.toEmail) {
            const emailData = notification.toEmail();

            // Handle Template Rendering
            if (emailData.template) {
              if (!this.renderer) {
                throw new NotificationConfigurationException(
                  'Template provided but no renderer configured.',
                  {
                    template: emailData.template,
                  },
                );
              }

              emailData.html = await this.renderer.render(
                emailData.template,
                emailData.context || {},
              );
            }

            if (!routingInfo) return null;

            return NotificationRequestMapper.createEmailRequest(
              emailData,
              routingInfo,
              notification,
            );
          }
          break;

        case NotificationChannel.SMS:
          if (notification.toSms) {
            const smsData = notification.toSms();
            if (!routingInfo) return null;
            return NotificationRequestMapper.createSmsRequest(smsData, routingInfo, notification);
          }
          break;

        case NotificationChannel.PUSH:
          if (notification.toPush) {
            const pushData = notification.toPush();
            if (!routingInfo) return null;
            return NotificationRequestMapper.createPushRequest(pushData, routingInfo, notification);
          }
          break;

        case NotificationChannel.IN_APP:
          if (notification.toInApp) {
            const inAppData = notification.toInApp();
            if (!routingInfo) return null;
            return NotificationRequestMapper.createInAppRequest(
              inAppData,
              routingInfo,
              notification,
            );
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
