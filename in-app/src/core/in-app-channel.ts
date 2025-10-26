import {
  DatabaseChannel,
  SendInAppRequest,
  SendInAppResponse,
  NotificationStatus,
  NotificationConfigurationException,
  generateReference,
  sanitizeMetadata,
} from '@townkrier/core';

import { InAppConfig, InAppNotification } from '../types';

/**
 * In-app notification channel implementation
 */
export class InAppChannel extends DatabaseChannel {
  private readonly inAppConfig: InAppConfig;

  constructor(config: InAppConfig) {
    if (!config.storage) {
      throw new NotificationConfigurationException('Storage adapter is required for in-app notifications', {
        channel: 'InApp',
      });
    }

    // In-app doesn't need API keys, so we provide a dummy one
    super({ ...config, apiKey: 'in-app' }, 'InApp');
    this.inAppConfig = config;
  }

  /**
   * Send an in-app notification
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

      // For simplicity, we'll create one notification per recipient
      // In a real implementation, you might want to batch these
      const recipient = recipients[0];
      const notificationId = generateReference('INAPP');

      const notification: InAppNotification = {
        id: notificationId,
        userId: recipient.userId,
        title: request.title,
        message: request.message,
        type: request.type,
        actionUrl: request.actionUrl,
        icon: request.icon,
        data: request.data,
        status: 'sent',
        createdAt: new Date(),
      };

      // Save to storage
      const saved = await this.inAppConfig.storage.save(notification);

      const reference = request.reference || notificationId;

      return {
        success: true,
        notificationId: saved.id,
        reference,
        status: NotificationStatus.SENT,
        createdAt: saved.createdAt,
        metadata: sanitizeMetadata(request.metadata),
        raw: saved,
      };
    } catch (error) {
      return this.handleError(error, 'Failed to send in-app notification') as SendInAppResponse;
    }
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<InAppNotification[]> {
    return this.inAppConfig.storage.getByUserId(userId, limit, offset);
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    return this.inAppConfig.storage.markAsRead(notificationId);
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    return this.inAppConfig.storage.delete(notificationId);
  }

  /**
   * Handle errors and convert to standard notification response
   */
  private handleError(error: unknown, defaultMessage: string): SendInAppResponse {
    if (error instanceof Error) {
      const notificationError = error as Error & { code?: string; details?: unknown };

      return {
        success: false,
        notificationId: '',
        status: NotificationStatus.FAILED,
        error: {
          code: notificationError.code || 'IN_APP_ERROR',
          message: error.message || defaultMessage,
          details: notificationError.details || error,
        },
      };
    }

    return {
      success: false,
      notificationId: '',
      status: NotificationStatus.FAILED,
      error: {
        code: 'UNKNOWN_ERROR',
        message: defaultMessage,
        details: error,
      },
    };
  }

  /**
   * Override isReady to check storage instead of API key
   */
  isReady(): boolean {
    return !!this.inAppConfig.storage;
  }
}

/**
 * Factory function to create an in-app channel
 */
export function createInAppChannel(config: InAppConfig): InAppChannel {
  return new InAppChannel(config);
}
