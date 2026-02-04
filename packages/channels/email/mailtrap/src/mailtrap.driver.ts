import { NotificationDriver, SendResult, Notifiable } from 'townkrier-core';
import { MailtrapClient } from 'mailtrap';
import { MailtrapConfig } from './interfaces/mailtrap-config.interface';
import { MailtrapMessage } from './interfaces/mailtrap-message.interface';
import { MailtrapMapper } from './mailtrap.mapper';
import { NotificationConfigurationException, NotificationSendException } from 'townkrier-core';

export class MailtrapDriver implements NotificationDriver<MailtrapConfig, MailtrapMessage> {
  private client: MailtrapClient;
  private mailtrapConfig: MailtrapConfig;

  constructor(config: MailtrapConfig) {
    this.mailtrapConfig = config;
    this.validateConfig(config);
    this.client = new MailtrapClient({
      token: config.token,
      ...(config.endpoint && { endpoint: config.endpoint }),
      ...(config.testInboxId && { testInboxId: config.testInboxId }),
      ...(config.accountId && { accountId: config.accountId }),
    });
  }

  private validateConfig(config: MailtrapConfig) {
    if (!config.token) {
      throw new NotificationConfigurationException('API token is required for Mailtrap', {
        channel: 'Mailtrap',
      });
    }
  }

  async send(notifiable: Notifiable, message: MailtrapMessage, config?: MailtrapConfig): Promise<SendResult> {
    const route = notifiable.routeNotificationFor('email');

    // Consolidate recipient logic
    let recipients: any = message.to;

    if (!recipients) {
      if (!route) {
        throw new NotificationSendException('RecipientMissing: No recipient found for email');
      }
      recipients = [{ email: route as string }];
    }

    // Ensure message has "to"
    const messagePayload = { ...message, to: recipients };

    const from = message.from || this.mailtrapConfig.from || config?.from;
    if (!from) {
      throw new NotificationConfigurationException('SenderMissing: From address is required');
    }

    // Update payload with from
    messagePayload.from = from;

    try {
      // Prepare email data using Mapper
      const emailData = MailtrapMapper.toMailtrapData(messagePayload, this.mailtrapConfig);

      let response;
      let inboxId = this.mailtrapConfig.testInboxId;

      // Auto-detect inbox if not provided
      if (!inboxId) {
        try {
          const inboxes = await this.client.testing.inboxes.getList();
          if (inboxes && inboxes.length > 0) {
            inboxId = inboxes[0].id;
          }
        } catch (e) {
          // Ignore error, assume Production usage if listing fails
        }
      }

      if (inboxId) {
        // Use Sandbox API with detected or provided ID
        const tempClient = new MailtrapClient({
          token: this.mailtrapConfig.token,
          testInboxId: inboxId,
          accountId: this.mailtrapConfig.accountId
        });
        response = await tempClient.testing.send(emailData);

      } else {
        // Use Production Sending API
        response = await this.client.send(emailData);
      }

      if (!response.success) {
        throw new NotificationSendException(
          'Mailtrap API reported failure',
          response,
        );
      }

      const successResponse = MailtrapMapper.toSuccessResponse(response, messagePayload);

      return {
        id: successResponse.id,
        status: 'success',
        response: successResponse.response
      };

    } catch (error: any) {
      // Return structured error
      return {
        id: '',
        status: 'failed',
        error: new NotificationSendException(error.message || 'Failed to send email with Mailtrap', error),
        response: error
      };
    }
  }
}
