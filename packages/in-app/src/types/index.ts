import { NotificationChannelConfig } from '@townkrier/core';

/**
 * In-app notification storage interface
 */
export interface NotificationStorage {
  /**
   * Save a notification to storage
   */
  save(notification: InAppNotification): Promise<InAppNotification>;

  /**
   * Get notifications for a user
   */
  getByUserId(userId: string, limit?: number, offset?: number): Promise<InAppNotification[]>;

  /**
   * Mark a notification as read
   */
  markAsRead(notificationId: string): Promise<void>;

  /**
   * Delete a notification
   */
  delete(notificationId: string): Promise<void>;
}

/**
 * In-app notification data
 */
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

/**
 * In-app notification configuration
 */
export interface InAppConfig extends NotificationChannelConfig {
  /**
   * Storage adapter for notifications
   */
  storage: NotificationStorage;

  /**
   * Default retention period in days (0 = keep forever)
   */
  retentionDays?: number;
}
