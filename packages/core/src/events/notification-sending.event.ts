import { Notification } from '../core/notification';
import { NotificationChannelType } from '../types';
import { NotificationEvent } from './notification-event';

/**
 * Event fired when a notification is about to be sent
 */
export class NotificationSending extends NotificationEvent {
  constructor(notification: Notification, channels: NotificationChannelType[]) {
    super(notification, channels);
  }
}
