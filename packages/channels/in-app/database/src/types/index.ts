import { NotificationChannelConfig } from 'townkrier-core';

/**
 * In-app notification storage adapter interface
 * Implement this to store notifications in your database
 */
export interface InAppStorageAdapter {
  /**
   * Save a notification to storage
   */
  save(notification: InAppNotificationData): Promise<string>;

  /**
   * Get a notification by ID
   */
  get(id: string): Promise<InAppNotificationData | null>;

  /**
   * Get notifications for a user
   */
  getForUser(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
    },
  ): Promise<InAppNotificationData[]>;

  /**
   * Mark a notification as read
   */
  markAsRead(id: string): Promise<void>;

  /**
   * Mark all notifications as read for a user
   */
  markAllAsRead(userId: string): Promise<void>;

  /**
   * Delete a notification
   */
  delete(id: string): Promise<void>;

  /**
   * Count unread notifications for a user
   */
  countUnread(userId: string): Promise<number>;
}

/**
 * In-app notification data
 */
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

/**
 * In-app channel configuration
 */
export interface InAppConfig extends NotificationChannelConfig {
  /**
   * Storage adapter for persisting notifications
   */
  storageAdapter: InAppStorageAdapter;
}
