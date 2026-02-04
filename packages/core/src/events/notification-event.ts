import { Notification } from '../notification';
/**
 * Abstract base class for all notification lifecycle events.
 *
 * @template T - Type of the Notification object
 */
export abstract class NotificationEvent<T = Notification> {
  /**
   * The notification instance associated with this event.
   */
  public notification: T;

  /**
   * The list of channels this notification is targeting or has targeted.
   */
  public channels: string[];

  constructor(notification: T, channels: string[]) {
    this.notification = notification;
    this.channels = channels;
  }
}
