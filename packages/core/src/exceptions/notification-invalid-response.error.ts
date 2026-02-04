import { NotificationProviderException } from './notification-provider.exception';
import { NotificationErrorCode } from './notification-error-codes';

/**
 * Exception thrown when a provider returns a response that cannot be parsed or is technically valid but indicates failure (e.g. 200 OK but body says "error").
 *
 * @example
 * ```typescript
 * throw new NotificationInvalidResponseError('Unexpected response structure from Mailtrap', 400, responseBody);
 * ```
 */
export class NotificationInvalidResponseError extends NotificationProviderException {
  /**
   * HTTP status code returned by the provider, if applicable.
   */
  public readonly statusCode?: number;

  /**
   * Creates a new NotificationInvalidResponseError.
   *
   * @param message - Error description
   * @param statusCode - HTTP Status code (optional)
   * @param details - Raw response body or details
   */
  constructor(message: string, statusCode?: number, details?: unknown) {
    super(message, NotificationErrorCode.INVALID_RESPONSE, details);
    this.name = 'NotificationInvalidResponseError';
    this.statusCode = statusCode;
  }
}
