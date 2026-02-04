import { NotificationDriver, SendResult, Notifiable, Logger } from 'townkrier-core';
import { Resend } from 'resend';
import { ResendConfig } from './interfaces/resend-config.interface';
import { ResendMessage } from './interfaces/resend-message.interface';
import { ResendMapper } from './resend.mapper';
import { NotificationConfigurationException, NotificationSendException } from 'townkrier-core';

// Helper for email validation if not in core
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export class ResendDriver implements NotificationDriver<ResendConfig, ResendMessage> {
  private client: Resend;
  private resendConfig: ResendConfig;

  constructor(config: ResendConfig) {
    this.resendConfig = config;
    if (!config.apiKey) {
      throw new NotificationConfigurationException('API Key is required for Resend', {
        channel: 'Resend',
      });
    }
    this.client = new Resend(config.apiKey);
  }

  async send(notifiable: Notifiable, message: ResendMessage, config?: ResendConfig): Promise<SendResult> {

    // 1. Resolve Recipient
    let recipients: string | string[] = message.to || (notifiable.routeNotificationFor('email') as any);

    if (!recipients) {
      throw new NotificationConfigurationException('RecipientMissing: No recipient found for email');
    }

    const recipientList = Array.isArray(recipients) ? recipients : [recipients];

    // 2. Validate Recipients
    for (const email of recipientList) {
      if (typeof email === 'string' && !isValidEmail(email)) {
        throw new NotificationConfigurationException(`Invalid email address: ${email}`, { email });
      }
    }

    // 3. Resolve From Address
    const from = message.from || this.resendConfig.from || config?.from;
    if (!from) {
      throw new NotificationConfigurationException('SenderMissing: From address is required');
    }

    try {
      // 4. Map Data
      const payload: ResendMessage = {
        ...message,
        to: recipientList,
        from: from
      };

      Logger.debug('SENDING RESEND MAIL', payload);
      const emailData = ResendMapper.toResendData(payload, this.resendConfig);

      // 5. Send
      const response = await this.client.emails.send(emailData);

      Logger.debug('Resend Raw Response', {
        hasData: !!response.data,
        hasError: !!response.error,
        error: response.error,
      });

      if (response.error) {
        throw new NotificationSendException(
          (response.error as any).message || 'Resend API Error',
          response.error
        );
      }

      if (!response.data) {
        throw new NotificationSendException('No response data from Resend');
      }

      // 6. Map Response
      const succcessResponse = ResendMapper.toSuccessResponse(response.data, payload);

      return {
        id: succcessResponse.id,
        status: 'success',
        response: succcessResponse.response
      };

    } catch (error: any) {
      // DEBUGGING: Log raw error
      console.error('[ResendDriver] Raw Error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

      // Handle From address error specifically if it comes from API
      if (error.message && error.message.includes('From email address is required')) {
        return {
          id: '',
          status: 'failed',
          error: new Error('SenderMissing: From address is required')
        };
      }

      return {
        id: '',
        status: 'failed',
        error: new Error(error.message || 'Failed to send email with Resend'),
        response: error
      };
    }
  }
}
