import { EmailRecipient, SmsRecipient, PushRecipient, InAppRecipient, NotificationMetadata, Attachment, NotificationPriority } from '../types';
export interface BaseNotificationRequest {
    title?: string;
    message: string;
    metadata?: NotificationMetadata;
    priority?: NotificationPriority;
    reference?: string;
}
export interface SendEmailRequest extends BaseNotificationRequest {
    from: EmailRecipient;
    to: EmailRecipient | EmailRecipient[];
    cc?: EmailRecipient[];
    bcc?: EmailRecipient[];
    subject: string;
    text?: string;
    html?: string;
    replyTo?: EmailRecipient;
    attachments?: Attachment[];
}
export interface SendSmsRequest extends BaseNotificationRequest {
    from?: string;
    to: SmsRecipient | SmsRecipient[];
    text: string;
}
export interface SendPushRequest extends BaseNotificationRequest {
    title: string;
    body: string;
    to: PushRecipient | PushRecipient[];
    imageUrl?: string;
    actionUrl?: string;
    icon?: string;
    sound?: string;
    badge?: number;
    data?: NotificationMetadata;
}
export interface SendInAppRequest extends BaseNotificationRequest {
    to: InAppRecipient | InAppRecipient[];
    title: string;
    type?: string;
    actionUrl?: string;
    icon?: string;
    data?: NotificationMetadata;
}
//# sourceMappingURL=notification-request.interface.d.ts.map