import { NotificationException } from './notification.exception';
import { NotificationErrorCode } from './notification-error-codes';

/**
 * Exception thrown when the overall sending process fails.
 * This can happen if all drivers in a fallback strategy fail, or if a critical error occurs during dispatch.
 *
 * @example
 * ```typescript
 * throw new NotificationSendException('All configured drivers failed to send the notification');
 * ```
 */
export class NotificationSendException extends NotificationException {
  /**
   * Creates a new NotificationSendException.
   *
   * @param message - Description of the send failure
   * @param details - Optional list of underlying errors or context
   */
  constructor(message: string, details?: unknown) {
    super(message, NotificationErrorCode.SEND_FAILED, details);
    this.name = 'NotificationSendException';
  }
}
