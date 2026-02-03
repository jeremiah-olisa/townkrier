import { NotificationException } from './notification.exception';
import { NotificationErrorCode } from './notification-error-codes';

/**
 * Exception thrown when notification data or payload fails validation.
 *
 * @example
 * ```typescript
 * if (!message.to) {
 *   throw new NotificationValidationException('Missing recipient email address');
 * }
 * ```
 */
export class NotificationValidationException extends NotificationException {
  /**
   * Creates a new NotificationValidationException.
   *
   * @param message - Description of the validation failure
   * @param details - Optional validation context
   */
  constructor(message: string, details?: unknown) {
    super(message, NotificationErrorCode.INVALID_REQUEST, details);
    this.name = 'NotificationValidationException';
  }
}
