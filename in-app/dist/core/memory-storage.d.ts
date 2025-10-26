import { NotificationStorage, InAppNotification } from '../types';
export declare class MemoryStorage implements NotificationStorage {
    private notifications;
    private maxSize;
    constructor(maxSize?: number);
    save(notification: InAppNotification): Promise<InAppNotification>;
    getByUserId(userId: string, limit?: number, offset?: number): Promise<InAppNotification[]>;
    markAsRead(notificationId: string): Promise<void>;
    delete(notificationId: string): Promise<void>;
    clear(): void;
    size(): number;
}
//# sourceMappingURL=memory-storage.d.ts.map