"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationSendException = exports.NotificationInvalidResponseError = exports.NotificationProviderException = exports.NotificationValidationException = exports.NotificationChannelException = exports.NotificationConfigurationException = exports.NotificationException = void 0;
const notification_error_codes_1 = require("./notification-error-codes");
class NotificationException extends Error {
    constructor(message, code = notification_error_codes_1.NotificationErrorCode.UNKNOWN_ERROR, details) {
        super(message);
        this.name = 'NotificationException';
        this.code = code;
        this.details = details;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
exports.NotificationException = NotificationException;
class NotificationConfigurationException extends NotificationException {
    constructor(message, details) {
        super(message, notification_error_codes_1.NotificationErrorCode.CONFIGURATION_ERROR, details);
        this.name = 'NotificationConfigurationException';
    }
}
exports.NotificationConfigurationException = NotificationConfigurationException;
class NotificationChannelException extends NotificationException {
    constructor(message, code = notification_error_codes_1.NotificationErrorCode.CHANNEL_ERROR, details) {
        super(message, code, details);
        this.name = 'NotificationChannelException';
    }
}
exports.NotificationChannelException = NotificationChannelException;
class NotificationValidationException extends NotificationException {
    constructor(message, details) {
        super(message, notification_error_codes_1.NotificationErrorCode.INVALID_REQUEST, details);
        this.name = 'NotificationValidationException';
    }
}
exports.NotificationValidationException = NotificationValidationException;
class NotificationProviderException extends NotificationException {
    constructor(message, code = notification_error_codes_1.NotificationErrorCode.PROVIDER_ERROR, details) {
        super(message, code, details);
        this.name = 'NotificationProviderException';
    }
}
exports.NotificationProviderException = NotificationProviderException;
class NotificationInvalidResponseError extends NotificationProviderException {
    constructor(message, statusCode, details) {
        super(message, notification_error_codes_1.NotificationErrorCode.INVALID_RESPONSE, details);
        this.name = 'NotificationInvalidResponseError';
        this.statusCode = statusCode;
    }
}
exports.NotificationInvalidResponseError = NotificationInvalidResponseError;
class NotificationSendException extends NotificationException {
    constructor(message, details) {
        super(message, notification_error_codes_1.NotificationErrorCode.SEND_FAILED, details);
        this.name = 'NotificationSendException';
    }
}
exports.NotificationSendException = NotificationSendException;
//# sourceMappingURL=notification.exception.js.map