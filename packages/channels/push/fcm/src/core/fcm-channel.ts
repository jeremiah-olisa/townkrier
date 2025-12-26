import * as admin from 'firebase-admin';
import {
  PushChannel,
  SendPushRequest,
  SendPushResponse,
  NotificationConfigurationException,
} from '@townkrier/core';

import { FcmConfig } from '../types';
import { FcmSendResponse } from '../interfaces';
import { FcmMapper } from './fcm.mapper';

/**
 * Firebase Cloud Messaging push notification channel implementation
 */
export class FcmChannel extends PushChannel {
  private readonly fcmConfig: FcmConfig;
  private app: admin.app.App;

  constructor(config: FcmConfig) {
    super(config, 'FCM');
    this.fcmConfig = config;

    // Initialize Firebase Admin
    try {
      const credential = config.serviceAccount
        ? admin.credential.cert(config.serviceAccount)
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
   * Validate channel configuration
   */
  protected validateConfig(): void {
    const config = this.config as unknown as FcmConfig;
    if (!config.serviceAccount && !config.serviceAccountPath) {
      throw new NotificationConfigurationException(
        'Service account credentials or path is required for FCM',
        {
          channel: 'FCM',
        },
      );
    }
  }

  /**
   * Check if the channel is ready
   */
  isReady(): boolean {
    return !!this.app;
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

      // Prepare FCM message using Mapper
      const message = FcmMapper.toFcmMessage(request);

      let response: FcmSendResponse;

      // Send to single or multiple tokens
      if (deviceTokens.length === 1) {
        const result = await admin.messaging(this.app).send({
          token: deviceTokens[0],
          ...message,
        } as admin.messaging.Message);

        response = FcmMapper.toChannelResponse(result);
      } else {
        const result = await admin.messaging(this.app).sendEachForMulticast({
          tokens: deviceTokens,
          ...message,
        } as admin.messaging.MulticastMessage);

        response = FcmMapper.toChannelResponse(result);
      }

      return FcmMapper.toSuccessResponse(response, request);
    } catch (error) {
      return FcmMapper.toErrorResponse(error, 'Failed to send push notification');
    }
  }

  protected isValidNotificationRequest(request: any): request is SendPushRequest {
    return request && (request.title || request.body) && (request.to || Array.isArray(request.to));
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
