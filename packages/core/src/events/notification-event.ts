import { Notification } from '../core/notification';
import { NotificationChannelType } from '../types';

/**
 * Base notification event
 */
export abstract class NotificationEvent {
  constructor(
    public readonly notification: Notification,
    public readonly channels: NotificationChannelType[],
  ) {}
}
