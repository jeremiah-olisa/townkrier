export declare class NotificationException extends Error {
    readonly code: string;
    readonly details?: unknown;
    constructor(message: string, code?: string, details?: unknown);
}
export declare class NotificationConfigurationException extends NotificationException {
    constructor(message: string, details?: unknown);
}
export declare class NotificationChannelException extends NotificationException {
    constructor(message: string, code?: string, details?: unknown);
}
export declare class NotificationValidationException extends NotificationException {
    constructor(message: string, details?: unknown);
}
export declare class NotificationProviderException extends NotificationException {
    constructor(message: string, code?: string, details?: unknown);
}
export declare class NotificationInvalidResponseError extends NotificationProviderException {
    readonly statusCode?: number;
    constructor(message: string, statusCode?: number, details?: unknown);
}
export declare class NotificationSendException extends NotificationException {
    constructor(message: string, details?: unknown);
}
//# sourceMappingURL=notification.exception.d.ts.map