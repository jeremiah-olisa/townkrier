import { NotificationErrorCode } from './notification-error-codes';

/**
 * Base exception class for all notification-related errors in Townkrier.
 * All custom exceptions in the system extend this class.
 *
 * @example
 * ```typescript
 * try {
 *   // ... notification logic
 * } catch (error) {
 *   if (error instanceof NotificationException) {
 *     console.error(`Townkrier Error [${error.code}]: ${error.message}`);
 *   }
 * }
 * ```
 */
export class NotificationException extends Error {
  /**
   * A unique error code identifying the type of error.
   * @see NotificationErrorCode
   */
  public readonly code: string;

  /**
   * Optional additional details about the error (e.g., inner errors, context).
   */
  public readonly details?: unknown;

  /**
   * Creates a new NotificationException.
   *
   * @param message - Descriptive error message
   * @param code - Error code from NotificationErrorCode (default: UNKNOWN_ERROR)
   * @param details - Optional context or inner error
   */
  constructor(
    message: string,
    code: string = NotificationErrorCode.UNKNOWN_ERROR,
    details?: unknown,
  ) {
    super(message);
    this.name = 'NotificationException';
    this.code = code;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
