import { Notification } from '../notification';
import { NotificationEvent } from './notification-event';

/**
 * Event dispatched after a notification has been **successfully** (or partially) sent.
 * Contains the responses from the individual drivers.
 */
export class NotificationSent extends NotificationEvent {
  /**
   * Map of channel names to their successful send results/responses.
   */
  public responses: Map<string, unknown>;

  constructor(notification: Notification, channels: string[], responses: Map<string, unknown>) {
    super(notification, channels);
    this.responses = responses;
  }
}
