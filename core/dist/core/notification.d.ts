import { NotificationChannel, NotificationPriority, NotificationMetadata } from '../types';
export declare abstract class Notification {
    priority: NotificationPriority;
    reference?: string;
    metadata?: NotificationMetadata;
    abstract via(): NotificationChannel[];
    toEmail?(): {
        subject: string;
        text?: string;
        html?: string;
        from?: {
            email: string;
            name?: string;
        };
        replyTo?: {
            email: string;
            name?: string;
        };
    };
    toSms?(): {
        text: string;
        from?: string;
    };
    toPush?(): {
        title: string;
        body: string;
        imageUrl?: string;
        actionUrl?: string;
        icon?: string;
        sound?: string;
        badge?: number;
        data?: NotificationMetadata;
    };
    toInApp?(): {
        title: string;
        message: string;
        type?: string;
        actionUrl?: string;
        icon?: string;
        data?: NotificationMetadata;
    };
    setPriority(priority: NotificationPriority): this;
    setReference(reference: string): this;
    setMetadata(metadata: NotificationMetadata): this;
}
//# sourceMappingURL=notification.d.ts.map