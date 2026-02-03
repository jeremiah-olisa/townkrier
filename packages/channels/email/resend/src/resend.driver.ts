import { NotificationDriver, SendResult, Notifiable } from 'townkrier-core';
import { Resend } from 'resend';

export interface ResendConfig {
  apiKey: string;
  from?: string;
  // Others as needed
}

export interface ResendMessage {
  subject: string;
  html?: string;
  text?: string;
  to?: string | string[];
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  reply_to?: string | string[];
  attachments?: any[];
  headers?: Record<string, string>;
  tags?: any[];
}

export class ResendDriver implements NotificationDriver<ResendConfig, ResendMessage> {
  private client: Resend;

  constructor(private config: ResendConfig) {
    if (!config.apiKey) {
      throw new Error('ResendApiKeyMissing: API Key is required');
    }
    this.client = new Resend(config.apiKey);
  }

  async send(
    notifiable: Notifiable,
    message: ResendMessage,
    config?: ResendConfig,
  ): Promise<SendResult> {
    const recipient = message.to || notifiable.routeNotificationFor('email');

    if (!recipient) {
      throw new Error('RecipientMissing: No recipient found for email');
    }

    const from = message.from || this.config.from || config?.from;

    if (!from) {
      throw new Error('SenderMissing: From address is required');
    }

    try {
      const response = await this.client.emails.send({
        ...message,
        from,
        to: recipient,
      });

      if (response.error) {
        return {
          id: '',
          status: 'failed',
          error: response.error,
          response: response,
        };
      }

      return {
        id: response.data?.id || '',
        status: 'success',
        response: response.data,
      };
    } catch (error) {
      return {
        id: '',
        status: 'failed',
        error: error,
      };
    }
  }
}
