export interface InAppNotificationData {
    id?: string;
    userId: string;
    title: string;
    message: string;
    type?: string;
    actionUrl?: string;
    icon?: string;
    data?: Record<string, unknown>;
    read?: boolean;
    readAt?: Date;
    createdAt?: Date;
    metadata?: Record<string, unknown>;
}

export interface InAppStorageAdapter {
    save(notification: InAppNotificationData): Promise<string>;
    get(id: string): Promise<InAppNotificationData | null>;
    getForUser(userId: string, options?: { limit?: number; offset?: number; unreadOnly?: boolean }): Promise<InAppNotificationData[]>;
    markAsRead(id: string): Promise<void>;
    markAllAsRead(userId: string): Promise<void>;
    delete(id: string): Promise<void>;
    countUnread(userId: string): Promise<number>;
}

export interface DatabaseConfig {
    storageAdapter: InAppStorageAdapter;
    [key: string]: any;
}
