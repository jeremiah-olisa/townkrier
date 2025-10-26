import { InAppStorageAdapter, InAppNotificationData } from '../types';

/**
 * Simple in-memory storage adapter for in-app notifications
 * This is a reference implementation for testing and development
 * For production, implement a database-backed adapter
 */
export class InMemoryInAppStorageAdapter implements InAppStorageAdapter {
  private notifications: Map<string, InAppNotificationData> = new Map();
  private idCounter = 1;

  /**
   * Save a notification to memory
   */
  async save(notification: InAppNotificationData): Promise<string> {
    const id = notification.id || `inapp-${this.idCounter++}`;
    const data: InAppNotificationData = {
      ...notification,
      id,
      createdAt: notification.createdAt || new Date(),
      read: notification.read || false,
    };

    this.notifications.set(id, data);
    return id;
  }

  /**
   * Get a notification by ID
   */
  async get(id: string): Promise<InAppNotificationData | null> {
    return this.notifications.get(id) || null;
  }

  /**
   * Get notifications for a user
   */
  async getForUser(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
    },
  ): Promise<InAppNotificationData[]> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    const unreadOnly = options?.unreadOnly || false;

    const userNotifications = Array.from(this.notifications.values())
      .filter((n) => n.userId === userId)
      .filter((n) => !unreadOnly || !n.read)
      .sort((a, b) => {
        const aTime = a.createdAt?.getTime() || 0;
        const bTime = b.createdAt?.getTime() || 0;
        return bTime - aTime; // Newest first
      });

    return userNotifications.slice(offset, offset + limit);
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string): Promise<void> {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.read = true;
      notification.readAt = new Date();
      this.notifications.set(id, notification);
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    const entries = Array.from(this.notifications.entries());
    for (const [id, notification] of entries) {
      if (notification.userId === userId && !notification.read) {
        notification.read = true;
        notification.readAt = new Date();
        this.notifications.set(id, notification);
      }
    }
  }

  /**
   * Delete a notification
   */
  async delete(id: string): Promise<void> {
    this.notifications.delete(id);
  }

  /**
   * Count unread notifications for a user
   */
  async countUnread(userId: string): Promise<number> {
    return Array.from(this.notifications.values()).filter((n) => n.userId === userId && !n.read)
      .length;
  }

  /**
   * Clear all notifications (for testing)
   */
  clear(): void {
    this.notifications.clear();
    this.idCounter = 1;
  }
}
