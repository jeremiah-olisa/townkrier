import { NotificationErrorCode } from './notification-error-codes';

/**
 * Base exception class for notification-related errors
 */
export class NotificationException extends Error {
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, code: string = NotificationErrorCode.UNKNOWN_ERROR, details?: unknown) {
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

/**
 * Exception for configuration errors
 */
export class NotificationConfigurationException extends NotificationException {
  constructor(message: string, details?: unknown) {
    super(message, NotificationErrorCode.CONFIGURATION_ERROR, details);
    this.name = 'NotificationConfigurationException';
  }
}

/**
 * Exception for channel errors
 */
export class NotificationChannelException extends NotificationException {
  constructor(message: string, code: string = NotificationErrorCode.CHANNEL_ERROR, details?: unknown) {
    super(message, code, details);
    this.name = 'NotificationChannelException';
  }
}

/**
 * Exception for validation errors
 */
export class NotificationValidationException extends NotificationException {
  constructor(message: string, details?: unknown) {
    super(message, NotificationErrorCode.INVALID_REQUEST, details);
    this.name = 'NotificationValidationException';
  }
}

/**
 * Exception for provider errors
 */
export class NotificationProviderException extends NotificationException {
  constructor(message: string, code: string = NotificationErrorCode.PROVIDER_ERROR, details?: unknown) {
    super(message, code, details);
    this.name = 'NotificationProviderException';
  }
}

/**
 * Exception for invalid responses from providers
 */
export class NotificationInvalidResponseError extends NotificationProviderException {
  public readonly statusCode?: number;

  constructor(message: string, statusCode?: number, details?: unknown) {
    super(message, NotificationErrorCode.INVALID_RESPONSE, details);
    this.name = 'NotificationInvalidResponseError';
    this.statusCode = statusCode;
  }
}

/**
 * Exception for send failures
 */
export class NotificationSendException extends NotificationException {
  constructor(message: string, details?: unknown) {
    super(message, NotificationErrorCode.SEND_FAILED, details);
    this.name = 'NotificationSendException';
  }
}
