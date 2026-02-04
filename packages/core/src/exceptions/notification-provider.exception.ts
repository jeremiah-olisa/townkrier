import { NotificationException } from './notification.exception';
import { NotificationErrorCode } from './notification-error-codes';

/**
 * Exception thrown when the external notification provider service encounters an error.
 * Examples include API downtime, rate limits, or authentication failures from the provider.
 *
 * @example
 * ```typescript
 * throw new NotificationProviderException('Resend API responded with 500 Internal Server Error');
 * ```
 */
export class NotificationProviderException extends NotificationException {
  /**
   * Creates a new NotificationProviderException.
   *
   * @param message - Error description from the provider
   * @param code - Error code (defaults to PROVIDER_ERROR)
   * @param details - Raw response or error from the provider
   */
  constructor(
    message: string,
    code: string = NotificationErrorCode.PROVIDER_ERROR,
    details?: unknown,
  ) {
    super(message, code, details);
    this.name = 'NotificationProviderException';
  }
}
