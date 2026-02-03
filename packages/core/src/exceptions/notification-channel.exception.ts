import { NotificationException } from './notification.exception';
import { NotificationErrorCode } from './notification-error-codes';

/**
 * Exception thrown when a generic error occurs within a specific channel.
 * This is often used as a wrapper for underlying channel-specific issues.
 *
 * @example
 * ```typescript
 * throw new NotificationChannelException('Failed to process channel "sms"', NotificationErrorCode.CHANNEL_ERROR, originalError);
 * ```
 */
export class NotificationChannelException extends NotificationException {
  /**
   * Creates a new NotificationChannelException.
   *
   * @param message - Error description
   * @param code - Specific error code (defaults to CHANNEL_ERROR)
   * @param details - Optional cause or context
   */
  constructor(
    message: string,
    code: string = NotificationErrorCode.CHANNEL_ERROR,
    details?: unknown,
  ) {
    super(message, code, details);
    this.name = 'NotificationChannelException';
  }
}
