export declare enum NotificationChannel {
    EMAIL = "email",
    SMS = "sms",
    PUSH = "push",
    IN_APP = "in_app",
    SLACK = "slack",
    DATABASE = "database"
}
export declare enum NotificationStatus {
    PENDING = "pending",
    SENT = "sent",
    DELIVERED = "delivered",
    FAILED = "failed",
    READ = "read"
}
export declare enum NotificationPriority {
    LOW = "low",
    NORMAL = "normal",
    HIGH = "high",
    URGENT = "urgent"
}
export interface EmailRecipient {
    email: string;
    name?: string;
}
export interface SmsRecipient {
    phone: string;
    name?: string;
}
export interface PushRecipient {
    deviceToken: string;
    userId?: string;
    platform?: 'ios' | 'android' | 'web';
}
export interface InAppRecipient {
    userId: string;
    email?: string;
}
export type NotificationMetadata = Record<string, unknown>;
export interface NotificationError {
    code: string;
    message: string;
    details?: unknown;
}
export interface Attachment {
    filename: string;
    content?: Buffer | string;
    path?: string;
    contentType?: string;
    url?: string;
}
//# sourceMappingURL=index.d.ts.map