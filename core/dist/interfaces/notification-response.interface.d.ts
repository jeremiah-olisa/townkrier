import { NotificationStatus, NotificationError, NotificationMetadata } from '../types';
export interface NotificationResponse {
    success: boolean;
    error?: NotificationError;
    raw?: any;
}
export interface SendEmailResponse extends NotificationResponse {
    messageId: string;
    reference?: string;
    status: NotificationStatus;
    sentAt?: Date;
    metadata?: NotificationMetadata;
}
export interface SendSmsResponse extends NotificationResponse {
    messageId: string;
    reference?: string;
    status: NotificationStatus;
    sentAt?: Date;
    units?: number;
    metadata?: NotificationMetadata;
}
export interface SendPushResponse extends NotificationResponse {
    messageId: string;
    reference?: string;
    status: NotificationStatus;
    sentAt?: Date;
    successCount?: number;
    failureCount?: number;
    metadata?: NotificationMetadata;
}
export interface SendInAppResponse extends NotificationResponse {
    notificationId: string;
    reference?: string;
    status: NotificationStatus;
    createdAt?: Date;
    metadata?: NotificationMetadata;
}
//# sourceMappingURL=notification-response.interface.d.ts.map