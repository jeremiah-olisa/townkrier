import { Notification } from '../core/notification';
import { NotificationChannelType } from '../types';
import { NotificationEvent } from './notification-event';

/**
 * Event fired after a notification has been sent successfully
 */
export class NotificationSent extends NotificationEvent {
  constructor(
    notification: Notification,
    channels: NotificationChannelType[],
    public readonly responses: Map<NotificationChannelType, unknown>,
  ) {
    super(notification, channels);
  }
}
