import { Notification } from '../notification';
import { NotificationEvent } from './notification-event';

/**
 * Event dispatched when a notification fails to send.
 * Only dispatched if the global `DeliveryStrategy` aborts the process (e.g., 'all-or-nothing')
 * or if all channels fail in a 'best-effort' strategy.
 */
export class NotificationFailed extends NotificationEvent {
  /**
   * The error that caused the notification failure.
   */
  public error: Error;

  /**
   * The specific channel that triggered the failure, if applicable.
   */
  public failedChannel?: string;

  constructor(
    notification: Notification,
    channels: string[],
    error: Error,
    failedChannel?: string,
  ) {
    super(notification, channels);
    this.error = error;
    this.failedChannel = failedChannel;
  }
}
