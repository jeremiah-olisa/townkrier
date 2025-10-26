import * as admin from 'firebase-admin';
import {
  PushChannel,
  SendPushRequest,
  SendPushResponse,
  NotificationStatus,
  NotificationConfigurationException,
  generateReference,
  sanitizeMetadata,
} from '@townkrier/core';

import { FcmConfig } from '../types';
import { FcmMessageData, FcmSendResponse } from '../interfaces';

/**
 * Firebase Cloud Messaging push notification channel implementation
 */
export class FcmChannel extends PushChannel {
  private readonly fcmConfig: FcmConfig;
  private app: admin.app.App;

  constructor(config: FcmConfig) {
    if (!config.serviceAccount && !config.serviceAccountPath) {
      throw new NotificationConfigurationException(
        'Service account credentials or path is required for FCM',
        {
          channel: 'FCM',
        },
      );
    }

    super(config, 'FCM');
    this.fcmConfig = config;

    // Initialize Firebase Admin
    try {
      const credential = config.serviceAccount
        ? admin.credential.cert(config.serviceAccount as admin.ServiceAccount)
        : config.serviceAccountPath
          ? admin.credential.cert(config.serviceAccountPath)
          : admin.credential.applicationDefault();

      this.app = admin.initializeApp(
        {
          credential,
          projectId: config.projectId,
          databaseURL: config.databaseURL,
        },
        `fcm-${Date.now()}`,
      );
    } catch (error) {
      throw new NotificationConfigurationException(
        `Failed to initialize Firebase Admin: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          channel: 'FCM',
          error,
        },
      );
    }
  }

  /**
   * Send a push notification
   */
  async sendPush(request: SendPushRequest): Promise<SendPushResponse> {
    try {
      // Get recipients
      const recipients = Array.isArray(request.to) ? request.to : [request.to];
      const deviceTokens = recipients.map((r) => r.deviceToken);

      if (deviceTokens.length === 0) {
        throw new NotificationConfigurationException('No device tokens provided', {
          recipients,
        });
      }

      // Prepare FCM message
      const message: FcmMessageData = {
        notification: {
          title: request.title,
          body: request.body,
          imageUrl: request.imageUrl,
        },
      };

      // Add platform-specific configurations
      if (request.icon || request.sound || request.badge) {
        message.android = {
          priority:
            request.priority === 'urgent' || request.priority === 'high' ? 'high' : 'normal',
          notification: {
            icon: request.icon,
            sound: request.sound,
          },
        };

        if (request.sound || request.badge) {
          message.apns = {
            payload: {
              aps: {
                ...(request.sound && { sound: request.sound }),
                ...(request.badge !== undefined && { badge: request.badge }),
              },
            },
          };
        }

        message.webpush = {
          notification: {
            icon: request.icon,
          },
        };
      }

      // Add data payload
      if (request.data) {
        // FCM requires all data values to be strings
        message.data = Object.entries(request.data).reduce(
          (acc, [key, value]) => {
            acc[key] = String(value);
            return acc;
          },
          {} as Record<string, string>,
        );
      }

      // Add action URL as data
      if (request.actionUrl) {
        if (!message.data) message.data = {};
        message.data.actionUrl = request.actionUrl;
      }

      let response: FcmSendResponse;

      // Send to single or multiple tokens
      if (deviceTokens.length === 1) {
        const result = await admin.messaging(this.app).send({
          token: deviceTokens[0],
          ...message,
        } as admin.messaging.Message);

        response = {
          successCount: 1,
          failureCount: 0,
          responses: [
            {
              success: true,
              messageId: result,
            },
          ],
        };
      } else {
        const result = await admin.messaging(this.app).sendEachForMulticast({
          tokens: deviceTokens,
          ...message,
        } as admin.messaging.MulticastMessage);

        response = {
          successCount: result.successCount,
          failureCount: result.failureCount,
          responses: result.responses.map((r) => ({
            success: r.success,
            messageId: r.messageId,
            error: r.error
              ? {
                  code: r.error.code,
                  message: r.error.message,
                }
              : undefined,
          })),
        };
      }

      const reference = request.reference || generateReference('PUSH');
      const messageId = response.responses[0]?.messageId || '';

      return {
        success: response.successCount > 0,
        messageId,
        reference,
        status: response.successCount > 0 ? NotificationStatus.SENT : NotificationStatus.FAILED,
        sentAt: new Date(),
        successCount: response.successCount,
        failureCount: response.failureCount,
        metadata: sanitizeMetadata(request.metadata),
        raw: response,
      };
    } catch (error) {
      return this.handleError(error, 'Failed to send push notification') as SendPushResponse;
    }
  }

  /**
   * Handle errors and convert to standard notification response
   */
  private handleError(error: unknown, defaultMessage: string): SendPushResponse {
    if (error instanceof Error) {
      const fcmError = error as Error & { code?: string };

      return {
        success: false,
        messageId: '',
        status: NotificationStatus.FAILED,
        successCount: 0,
        failureCount: 1,
        error: {
          code: fcmError.code || 'FCM_ERROR',
          message: error.message || defaultMessage,
          details: error,
        },
      };
    }

    return {
      success: false,
      messageId: '',
      status: NotificationStatus.FAILED,
      successCount: 0,
      failureCount: 1,
      error: {
        code: 'UNKNOWN_ERROR',
        message: defaultMessage,
        details: error,
      },
    };
  }

  /**
   * Clean up Firebase app on destruction
   */
  async destroy(): Promise<void> {
    if (this.app) {
      await this.app.delete();
    }
  }
}

/**
 * Factory function to create an FCM channel
 */
export function createFcmChannel(config: FcmConfig): FcmChannel {
  return new FcmChannel(config);
}
