import { Notification } from '../notification';
import { NotificationChannelType } from '../types';
import { NotificationEvent } from './notification-event';

/**
 * Event dispatched **before** the notification sending process begins.
 * Useful for logging or intercepting the send request.
 */
export class NotificationSending extends NotificationEvent {
  constructor(notification: Notification, channels: NotificationChannelType[]) {
    super(notification, channels);
  }
}
