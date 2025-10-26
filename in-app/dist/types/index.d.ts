import { NotificationChannelConfig } from '@townkrier/core';
export interface NotificationStorage {
    save(notification: InAppNotification): Promise<InAppNotification>;
    getByUserId(userId: string, limit?: number, offset?: number): Promise<InAppNotification[]>;
    markAsRead(notificationId: string): Promise<void>;
    delete(notificationId: string): Promise<void>;
}
export interface InAppNotification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type?: string;
    actionUrl?: string;
    icon?: string;
    data?: Record<string, unknown>;
    status: 'pending' | 'sent' | 'read';
    createdAt: Date;
    readAt?: Date;
}
export interface InAppConfig extends NotificationChannelConfig {
    storage: NotificationStorage;
    retentionDays?: number;
}
//# sourceMappingURL=index.d.ts.map