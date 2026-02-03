import {
  InAppChannel,
  SendInAppRequest,
  SendInAppResponse,
  NotificationStatus,
  generateReference,
  sanitizeMetadata,
  Logger,
} from 'townkrier-core';

import { SseConfig, SseConnection, SseResponse, SseNotificationEvent } from '../types';
import { ISseChannel } from '../interfaces';

/**
 * Server-Sent Events (SSE) channel for real-time in-app notifications
 */
export class SseChannel extends InAppChannel implements ISseChannel {
  private readonly sseConfig: SseConfig;
  private connections: Map<string, Set<SseConnection>>;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(config: SseConfig) {
    super(config, 'SSE');
    this.sseConfig = {
      heartbeatInterval: 30000,
      maxConnections: 10,
      eventType: 'notification',
      ...config,
    };
    this.connections = new Map();

    // Start heartbeat mechanism
    this.startHeartbeat();
  }

  /**
   * Send an in-app notification via SSE
   */
  async sendInApp(request: SendInAppRequest): Promise<SendInAppResponse> {
    try {
      // Get recipients
      const recipients = Array.isArray(request.to) ? request.to : [request.to];

      if (recipients.length === 0) {
        return {
          notificationId: '',
          reference: request.reference || generateReference('SSE'),
          status: NotificationStatus.FAILED,
          createdAt: new Date(),
          error: {
            code: 'NO_RECIPIENTS',
            message: 'No recipients provided',
          },
        };
      }

      const reference = request.reference || generateReference('SSE');
      const notificationId = `sse_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      let sentCount = 0;
      const failedRecipients: string[] = [];

      // Send to each recipient
      for (const recipient of recipients) {
        const userId = recipient.userId;
        const sent = await this.sendToUser(userId, {
          id: notificationId,
          userId,
          title: request.title,
          message: request.message,
          type: request.type,
          actionUrl: request.actionUrl,
          icon: request.icon,
          data: request.data,
          timestamp: new Date().toISOString(),
        });

        if (sent) {
          sentCount++;
        } else {
          failedRecipients.push(userId);
        }
      }

      const status = sentCount > 0 ? NotificationStatus.SENT : NotificationStatus.FAILED;

      return {
        notificationId,
        reference,
        status,
        createdAt: new Date(),
        metadata: sanitizeMetadata({
          ...request.metadata,
          sentCount,
          totalRecipients: recipients.length,
          failedRecipients: failedRecipients.length > 0 ? failedRecipients : undefined,
        }),
        raw: {
          sentToConnections: sentCount,
          activeConnections: this.getConnectionCount(),
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to send SSE notification';

      return {
        notificationId: '',
        reference: request.reference || generateReference('SSE_ERR'),
        status: NotificationStatus.FAILED,
        createdAt: new Date(),
        error: {
          code: 'SSE_ERROR',
          message: errorMessage,
          details: error instanceof Error ? { stack: error.stack } : { error },
        },
      };
    }
  }

  /**
   * Send notification to a specific user
   */
  private async sendToUser(userId: string, notification: SseNotificationEvent): Promise<boolean> {
    const userConnections = this.connections.get(userId);

    if (!userConnections || userConnections.size === 0) {
      Logger.debug(`No active SSE connections for user: ${userId}`);
      return false;
    }

    const eventType = this.sseConfig.eventType || 'notification';
    const data = JSON.stringify(notification);
    const message = `event: ${eventType}\ndata: ${data}\nid: ${notification.id}\n\n`;

    let sentSuccessfully = false;

    // Send to all active connections for this user
    for (const connection of userConnections) {
      try {
        connection.response.write(message);
        sentSuccessfully = true;
      } catch (error) {
        Logger.error(`Failed to write to SSE connection for user ${userId}:`, error);
        // Remove failed connection
        this.removeConnectionInternal(userId, connection.response);
      }
    }

    return sentSuccessfully;
  }

  /**
   * Add a new SSE connection for a user
   */
  addConnection(userId: string, response: SseResponse): void {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }

    const userConnections = this.connections.get(userId)!;

    // Check connection limit
    if (this.sseConfig.maxConnections && userConnections.size >= this.sseConfig.maxConnections) {
      Logger.warn(
        `Maximum connections (${this.sseConfig.maxConnections}) reached for user: ${userId}`,
      );
      // Remove oldest connection
      const oldestConnection = Array.from(userConnections)[0];
      this.removeConnectionInternal(userId, oldestConnection.response);
    }

    const connection: SseConnection = {
      userId,
      response,
      connectedAt: new Date(),
      lastHeartbeat: new Date(),
    };

    userConnections.add(connection);

    Logger.debug(`SSE connection added for user: ${userId} (total: ${userConnections.size})`);

    // Send initial connection message
    try {
      response.write(`:connected\n\n`);
    } catch (error) {
      Logger.error(`Failed to send initial message to user ${userId}:`, error);
    }
  }

  /**
   * Remove an SSE connection
   */
  removeConnection(userId: string, response: SseResponse): void {
    this.removeConnectionInternal(userId, response);
  }

  /**
   * Internal method to remove connection
   */
  private removeConnectionInternal(userId: string, response: SseResponse): void {
    const userConnections = this.connections.get(userId);
    if (!userConnections) return;

    // Find and remove the connection
    for (const connection of userConnections) {
      if (connection.response === response) {
        userConnections.delete(connection);
        Logger.debug(
          `SSE connection removed for user: ${userId} (remaining: ${userConnections.size})`,
        );
        break;
      }
    }

    // Clean up empty sets
    if (userConnections.size === 0) {
      this.connections.delete(userId);
    }
  }

  /**
   * Get active connection count
   */
  getConnectionCount(): number {
    let total = 0;
    for (const connections of this.connections.values()) {
      total += connections.size;
    }
    return total;
  }

  /**
   * Get connection count for a specific user
   */
  getUserConnectionCount(userId: string): number {
    return this.connections.get(userId)?.size || 0;
  }

  /**
   * Get all connected user IDs
   */
  getConnectedUsers(): string[] {
    return Array.from(this.connections.keys());
  }

  /**
   * Start heartbeat mechanism to keep connections alive
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    const interval = this.sseConfig.heartbeatInterval || 30000;

    this.heartbeatInterval = setInterval(() => {
      const heartbeat = `:heartbeat ${new Date().toISOString()}\n\n`;

      for (const [userId, userConnections] of this.connections.entries()) {
        for (const connection of userConnections) {
          try {
            connection.response.write(heartbeat);
            connection.lastHeartbeat = new Date();
          } catch (error) {
            Logger.error(`Failed to send heartbeat to user ${userId}:`, error);
            this.removeConnectionInternal(userId, connection.response);
          }
        }
      }

      Logger.debug(`Heartbeat sent to ${this.getConnectionCount()} SSE connections`);
    }, interval);
  }

  /**
   * Stop heartbeat and clean up all connections
   */
  async destroy(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Close all connections
    for (const [userId, userConnections] of this.connections.entries()) {
      for (const connection of userConnections) {
        try {
          connection.response.end();
        } catch (error) {
          Logger.error(`Failed to close connection for user ${userId}:`, error);
        }
      }
    }

    this.connections.clear();
    Logger.log('SSE channel destroyed and all connections closed');
  }

  /**
   * Check if the channel is ready
   */
  isReady(): boolean {
    return true; // SSE is always ready once instantiated
  }

  /**
   * Validate configuration
   */
  protected validateConfig(): void {
    // No specific validation needed for SSE
  }

  /**
   * Validate notification request
   */
  protected isValidNotificationRequest(request: any): request is SendInAppRequest {
    return request && request.title && request.message && request.to;
  }
}

/**
 * Factory function to create an SSE channel
 */
export function createSseChannel(config: SseConfig): SseChannel {
  return new SseChannel(config);
}
