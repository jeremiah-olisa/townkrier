import {
  InAppChannel,
  SendInAppRequest,
  SendInAppResponse,
  NotificationStatus,
  NotificationConfigurationException,
  generateReference,
  sanitizeMetadata,
  Logger,
} from '@townkrier/core';

import { InAppConfig, InAppNotificationData } from '../types';
import { InAppNotificationResponse } from '../interfaces';

/**
 * In-app/database notification channel implementation
 * Stores notifications in a database for display within the application
 */
export class DatabaseInAppChannel extends InAppChannel {
  private readonly inAppConfig: InAppConfig;

  constructor(config: InAppConfig) {
    if (!config.storageAdapter) {
      throw new NotificationConfigurationException(
        'Storage adapter is required for in-app notifications',
        {
          channel: 'InApp',
        },
      );
    }

    super(config, 'InApp');
    this.inAppConfig = config;
  }

  /**
   * Send an in-app notification by storing it in the database
   */
  async sendInApp(request: SendInAppRequest): Promise<SendInAppResponse> {
    try {
      // Get recipients
      const recipients = Array.isArray(request.to) ? request.to : [request.to];

      if (recipients.length === 0) {
        throw new NotificationConfigurationException('No recipients provided', {
          recipients,
        });
      }

      const reference = request.reference || generateReference('INAPP');
      const results: string[] = [];

      // Save notification for each recipient
      for (const recipient of recipients) {
        const notificationData: InAppNotificationData = {
          userId: recipient.userId,
          title: request.title,
          message: request.message,
          type: request.type,
          actionUrl: request.actionUrl,
          icon: request.icon,
          data: request.data,
          read: false,
          createdAt: new Date(),
          metadata: sanitizeMetadata(request.metadata),
        };

        const notificationId = await this.inAppConfig.storageAdapter.save(notificationData);
        results.push(notificationId);
      }

      return {
        notificationId: results[0], // Return first notification ID
        reference,
        status: NotificationStatus.SENT,
        createdAt: new Date(),
        metadata: sanitizeMetadata(request.metadata),
        raw: {
          notificationIds: results,
          recipientCount: recipients.length,
        },
      };
    } catch (error) {
      return this.handleError(error, 'Failed to send in-app notification') as SendInAppResponse;
    }
  }

  /**
   * Get a notification by ID
   */
  async getNotification(id: string): Promise<InAppNotificationResponse | null> {
    try {
      const notification = await this.inAppConfig.storageAdapter.get(id);
      if (!notification) {
        return null;
      }

      return {
        id: notification.id!,
        userId: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        actionUrl: notification.actionUrl,
        icon: notification.icon,
        data: notification.data,
        read: notification.read || false,
        readAt: notification.readAt,
        createdAt: notification.createdAt || new Date(),
        metadata: notification.metadata,
      };
    } catch (error) {
      Logger.error('Failed to get notification:', error);
      return null;
    }
  }

  /**
   * Get notifications for a user
   */
  async getNotificationsForUser(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
    },
  ): Promise<InAppNotificationResponse[]> {
    try {
      const notifications = await this.inAppConfig.storageAdapter.getForUser(userId, options);

      return notifications.map((notification) => ({
        id: notification.id!,
        userId: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        actionUrl: notification.actionUrl,
        icon: notification.icon,
        data: notification.data,
        read: notification.read || false,
        readAt: notification.readAt,
        createdAt: notification.createdAt || new Date(),
        metadata: notification.metadata,
      }));
    } catch (error) {
      Logger.error('Failed to get notifications for user:', error);
      return [];
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string): Promise<void> {
    try {
      await this.inAppConfig.storageAdapter.markAsRead(id);
    } catch (error) {
      Logger.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      await this.inAppConfig.storageAdapter.markAllAsRead(userId);
    } catch (error) {
      Logger.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(id: string): Promise<void> {
    try {
      await this.inAppConfig.storageAdapter.delete(id);
    } catch (error) {
      Logger.error('Failed to delete notification:', error);
      throw error;
    }
  }

  /**
   * Count unread notifications for a user
   */
  async countUnread(userId: string): Promise<number> {
    try {
      return await this.inAppConfig.storageAdapter.countUnread(userId);
    } catch (error) {
      Logger.error('Failed to count unread notifications:', error);
      return 0;
    }
  }

  /**
   * Check if a notification request is valid for this channel
   */
  protected isValidNotificationRequest(notification: unknown): notification is SendInAppRequest {
    const req = notification as SendInAppRequest;
    return (
      typeof req === 'object' &&
      req !== null &&
      'to' in req && // Check for recipients
      typeof req.title === 'string' &&
      typeof req.message === 'string'
    );
  }

  /**
   * Handle errors and convert to standard notification response
   */
  private handleError(error: unknown, defaultMessage: string): SendInAppResponse {
    if (error instanceof Error) {
      const inAppError = error as Error & { code?: string };

      return {
        notificationId: '',
        status: NotificationStatus.FAILED,
        error: {
          code: inAppError.code || 'INAPP_ERROR',
          message: error.message || defaultMessage,
          details: error,
        },
      };
    }

    return {
      notificationId: '',
      status: NotificationStatus.FAILED,
      error: {
        code: 'UNKNOWN_ERROR',
        message: defaultMessage,
        details: error,
      },
    };
  }
}

/**
 * Factory function to create an in-app channel
 */
export function createInAppChannel(config: InAppConfig): DatabaseInAppChannel {
  return new DatabaseInAppChannel(config);
}
