import { NotificationDriver, SendResult, Notifiable } from 'townkrier-core';
import { Resend } from 'resend';
import { ResendConfig } from './interfaces/resend-config.interface';
import { ResendMessage } from './interfaces/resend-message.interface';

export class ResendDriver implements NotificationDriver<ResendConfig, ResendMessage> {
  private client: Resend;

  constructor(private config: ResendConfig) {
    if (!config.apiKey) {
      throw new Error('ResendApiKeyMissing: API Key is required');
    }
    this.client = new Resend(config.apiKey);
  }

  async send(notifiable: Notifiable, message: ResendMessage, config?: ResendConfig): Promise<SendResult> {
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
        to: recipient as string | string[],
        text: message.text || '', // Ensure text is at least empty string if undefined, or handle properly
      });

      if (response.error) {
        return {
          id: '',
          status: 'failed',
          error: response.error,
          response: response
        };
      }

      return {
        id: response.data?.id || '',
        status: 'success',
        response: response.data
      };
    } catch (error) {
      return {
        id: '',
        status: 'failed',
        error: error
      };
    }
  }
}
