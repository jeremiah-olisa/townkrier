import { NotificationException } from './notification.exception';
import { NotificationErrorCode } from './notification-error-codes';

/**
 * Exception thrown when there is an issue with the notification system configuration.
 * This includes missing drivers, invalid strategy setup, or malformed config objects.
 *
 * @example
 * ```typescript
 * throw new NotificationConfigurationException('Driver for channel "email" not configured');
 * ```
 */
export class NotificationConfigurationException extends NotificationException {
  /**
   * Creates a new NotificationConfigurationException.
   *
   * @param message - Description of the configuration error
   * @param details - Optional additional context
   */
  constructor(message: string, details?: unknown) {
    super(message, NotificationErrorCode.CONFIGURATION_ERROR, details);
    this.name = 'NotificationConfigurationException';
  }
}
