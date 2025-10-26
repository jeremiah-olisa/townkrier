import { INotificationChannel } from '../interfaces/notification-channel.interface';
import {
  SendEmailRequest,
  SendSmsRequest,
  SendPushRequest,
  SendInAppRequest,
  SendEmailResponse,
  SendSmsResponse,
  SendPushResponse,
  SendInAppResponse,
} from '../interfaces';
import { NotificationChannel } from '../types';
import { NotificationChannelConfig } from '../interfaces';

/**
 * Slack notification request (placeholder)
 */
export interface SlackNotificationRequest {
  channel?: string;
  text: string;
  attachments?: unknown[];
}

/**
 * Slack notification response (placeholder)
 */
export interface SlackNotificationResponse {
  success: boolean;
  ts?: string;
  error?: unknown;
  raw?: unknown;
}

/**
 * Abstract base class for Slack channel implementations
 */
export abstract class SlackChannel implements INotificationChannel {
  protected config: NotificationChannelConfig;
  protected channelName: string;
  protected channelType: NotificationChannel;

  constructor(config: NotificationChannelConfig, channelName: string) {
    this.config = config;
    this.channelName = channelName;
    this.channelType = NotificationChannel.SLACK;
  }

  /**
   * Send a Slack notification
   */
  abstract sendSlack(request: SlackNotificationRequest): Promise<SlackNotificationResponse>;

  /**
   * Send method implementation that delegates to sendSlack
   * For Slack, we accept any of the standard notification types and convert them
   */
  async send(
    notification:
      | SendEmailRequest
      | SendSmsRequest
      | SendPushRequest
      | SendInAppRequest,
  ): Promise<
    | SendEmailResponse
    | SendSmsResponse
    | SendPushResponse
    | SendInAppResponse
  > {
    // Convert to Slack format and send
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const slackRequest: SlackNotificationRequest = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      text: (notification as any).message || (notification as any).text || (notification as any).body || '',
    };
    
    const result = await this.sendSlack(slackRequest);
    
    // Convert back to standard response format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return {
      success: result.success,
      messageId: result.ts || '',
      status: result.success ? 'sent' as const : 'failed' as const,
      raw: result.raw,
    } as any;
  }

  /**
   * Get the channel name
   */
  getChannelName(): string {
    return this.channelName;
  }

  /**
   * Get the channel type
   */
  getChannelType(): NotificationChannel {
    return this.channelType;
  }

  /**
   * Check if the channel is ready
   */
  isReady(): boolean {
    return !!(this.config.apiKey || this.config.secretKey);
  }
}
