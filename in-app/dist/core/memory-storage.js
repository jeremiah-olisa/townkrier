"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryStorage = void 0;
class MemoryStorage {
    constructor(maxSize = 1000) {
        this.notifications = new Map();
        this.maxSize = maxSize;
    }
    async save(notification) {
        if (this.notifications.size >= this.maxSize) {
            const oldestKey = this.notifications.keys().next().value;
            if (oldestKey) {
                this.notifications.delete(oldestKey);
            }
        }
        this.notifications.set(notification.id, notification);
        return notification;
    }
    async getByUserId(userId, limit = 20, offset = 0) {
        const userNotifications = Array.from(this.notifications.values())
            .filter((n) => n.userId === userId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return userNotifications.slice(offset, offset + limit);
    }
    async markAsRead(notificationId) {
        const notification = this.notifications.get(notificationId);
        if (notification) {
            notification.status = 'read';
            notification.readAt = new Date();
            this.notifications.set(notificationId, notification);
        }
    }
    async delete(notificationId) {
        this.notifications.delete(notificationId);
    }
    clear() {
        this.notifications.clear();
    }
    size() {
        return this.notifications.size;
    }
}
exports.MemoryStorage = MemoryStorage;
//# sourceMappingURL=memory-storage.js.map