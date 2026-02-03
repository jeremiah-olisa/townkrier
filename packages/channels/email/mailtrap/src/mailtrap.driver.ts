import { NotificationDriver, SendResult, Notifiable } from 'townkrier-core';
import { MailtrapClient } from 'mailtrap';
import { MailtrapConfig } from './interfaces/mailtrap-config.interface';
import { MailtrapMessage } from './interfaces/mailtrap-message.interface';

export class MailtrapDriver implements NotificationDriver<MailtrapConfig, MailtrapMessage> {
  private client: MailtrapClient;

  constructor(private config: MailtrapConfig) {
    if (!config.token) {
      throw new Error('MailtrapTokenMissing: Token is required');
    }
    this.client = new MailtrapClient({ token: config.token });
  }

  async send(notifiable: Notifiable, message: MailtrapMessage, config?: MailtrapConfig): Promise<SendResult> {
    const route = notifiable.routeNotificationFor('email');

    if (!message.to && !route) {
      throw new Error('RecipientMissing: No recipient found');
    }

    const recipients = message.to || [{ email: route as string }];
    const from = message.from || this.config.from || config?.from;

    if (!from) {
      throw new Error('SenderMissing: From address is required');
    }

    try {
      const response = await this.client.send({
        ...message,
        from,
        to: recipients
      });

      if (!response.success) {
        return {
          id: '',
          status: 'failed',
          error: response,
          response: response
        };
      }

      return {
        id: response.message_ids[0],
        status: 'success',
        response: response
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
