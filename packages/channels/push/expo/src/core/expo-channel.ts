import Expo, { ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import {
  PushChannel,
  SendPushRequest,
  SendPushResponse,
  NotificationConfigurationException,
  Logger,
} from 'townkrier-core';

import { ExpoConfig } from '../types';
import { ExpoMapper } from './expo.mapper';

/**
 * Expo Push Notifications channel implementation
 */
export class ExpoChannel extends PushChannel {
  private readonly expoConfig: ExpoConfig;
  private expo: Expo;

  constructor(config: ExpoConfig) {
    super(config, 'Expo');
    this.expoConfig = config;

    // Initialize Expo SDK
    try {
      this.expo = new Expo({
        accessToken: config.accessToken,
      });
    } catch (error) {
      throw new NotificationConfigurationException(
        `Failed to initialize Expo SDK: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          channel: 'Expo',
          error,
        },
      );
    }
  }

  /**
   * Validate channel configuration
   */
  protected validateConfig(): void {
    // Expo SDK doesn't require specific configuration
    // Token validation happens at send time
  }

  /**
   * Check if the channel is ready
   */
  isReady(): boolean {
    return !!this.expo;
  }

  /**
   * Send a push notification via Expo
   */
  async sendPush(request: SendPushRequest): Promise<SendPushResponse> {
    try {
      // Get recipients
      const recipients = Array.isArray(request.to) ? request.to : [request.to];
      const deviceTokens = recipients.map((r: any) => r.deviceToken);

      if (deviceTokens.length === 0) {
        throw new NotificationConfigurationException('No device tokens provided', {
          recipients,
        });
      }

      // Validate all push tokens
      const invalidTokens = deviceTokens.filter((token) => !Expo.isExpoPushToken(token));

      if (invalidTokens.length > 0) {
        throw new NotificationConfigurationException(
          `Invalid Expo push token(s): ${invalidTokens.join(', ')}`,
          {
            invalidTokens,
          },
        );
      }

      // Prepare messages
      const messages: ExpoPushMessage[] = deviceTokens.map((token) => ({
        to: token,
        title: request.title,
        body: request.body,
        data: request.data as any,
        sound: (request.sound as any) || 'default',
        badge: request.badge,
        priority: this.mapPriority(request.priority) as any,
      }));

      // Send notifications in chunks (Expo recommends max 100 per request)
      const chunks = this.expo.chunkPushNotifications(messages);
      const allTickets: ExpoPushTicket[] = [];

      for (const chunk of chunks) {
        try {
          const tickets = await this.expo.sendPushNotificationsAsync(chunk);
          allTickets.push(...tickets);
        } catch (error) {
          Logger.error('Failed to send chunk:', error);
          // Create error tickets for failed chunk
          allTickets.push(
            ...chunk.map(() => ({
              status: 'error' as const,
              message: error instanceof Error ? error.message : 'Failed to send notification',
              details: {
                error: 'DeviceNotRegistered' as const,
              },
            })),
          );
        }
      }

      // Count successes and failures
      const successCount = allTickets.filter((ticket) => ticket.status === 'ok').length;
      const failureCount = allTickets.length - successCount;

      const expoResponse = {
        successCount,
        failureCount,
        tickets: allTickets.map(ExpoMapper.normalizeTicket),
      };

      return ExpoMapper.toSuccessResponse(expoResponse, request);
    } catch (error) {
      return ExpoMapper.toErrorResponse(error, 'Failed to send push notification');
    }
  }

  /**
   * Map priority to Expo priority levels
   */
  private mapPriority(priority?: string): 'default' | 'normal' | 'high' {
    if (priority === 'high' || priority === 'urgent') return 'high';
    if (priority === 'low') return 'normal';
    return 'default';
  }

  /**
   * Check the status of receipts for sent notifications
   * @param receiptIds Array of receipt IDs to check
   */
  async checkReceipts(receiptIds: string[]): Promise<Record<string, any>> {
    try {
      const receiptIdChunks = this.expo.chunkPushNotificationReceiptIds(receiptIds);
      const allReceipts: Record<string, any> = {};

      for (const chunk of receiptIdChunks) {
        try {
          const receipts = await this.expo.getPushNotificationReceiptsAsync(chunk);
          Object.assign(allReceipts, receipts);
        } catch (error) {
          Logger.error('Failed to fetch receipts for chunk:', error);
        }
      }

      return allReceipts;
    } catch (error) {
      Logger.error('Failed to check receipts:', error);
      return {};
    }
  }

  protected isValidNotificationRequest(request: any): request is SendPushRequest {
    return request && (request.title || request.message) && request.to;
  }
}

/**
 * Factory function to create an Expo channel
 */
export function createExpoChannel(config: ExpoConfig): ExpoChannel {
  return new ExpoChannel(config);
}
