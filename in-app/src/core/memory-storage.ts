import { NotificationStorage, InAppNotification } from '../types';

/**
 * Simple in-memory storage for in-app notifications (for development/testing)
 */
export class MemoryStorage implements NotificationStorage {
  private notifications: Map<string, InAppNotification> = new Map();
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  async save(notification: InAppNotification): Promise<InAppNotification> {
    // If we're at capacity, remove oldest notification
    if (this.notifications.size >= this.maxSize) {
      const oldestKey = this.notifications.keys().next().value;
      if (oldestKey) {
        this.notifications.delete(oldestKey);
      }
    }

    this.notifications.set(notification.id, notification);
    return notification;
  }

  async getByUserId(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<InAppNotification[]> {
    const userNotifications = Array.from(this.notifications.values())
      .filter((n) => n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return userNotifications.slice(offset, offset + limit);
  }

  async markAsRead(notificationId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.status = 'read';
      notification.readAt = new Date();
      this.notifications.set(notificationId, notification);
    }
  }

  async delete(notificationId: string): Promise<void> {
    this.notifications.delete(notificationId);
  }

  /**
   * Clear all notifications (useful for testing)
   */
  clear(): void {
    this.notifications.clear();
  }

  /**
   * Get total count of notifications
   */
  size(): number {
    return this.notifications.size;
  }
}
