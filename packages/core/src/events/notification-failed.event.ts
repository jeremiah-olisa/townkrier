import { Notification } from '../core/notification';
import { NotificationChannelType } from '../types';
import { NotificationEvent } from './notification-event';

/**
 * Event fired when a notification fails to send
 */
export class NotificationFailed extends NotificationEvent {
  constructor(
    notification: Notification,
    channels: NotificationChannelType[],
    public readonly error: Error,
    public readonly failedChannel?: NotificationChannelType,
  ) {
    super(notification, channels);
  }
}
