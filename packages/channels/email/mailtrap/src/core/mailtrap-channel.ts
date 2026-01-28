import { MailtrapClient } from 'mailtrap';
import {
  MailChannel,
  SendEmailRequest,
  SendEmailResponse,
  NotificationStatus,
  NotificationConfigurationException,
  NotificationInvalidResponseError,
  isValidEmail,
  Logger,
} from 'townkrier-core';

import { MailtrapConfig } from '../types';
import { MailtrapMapper } from './mailtrap.mapper';

/**
 * Mailtrap email channel implementation
 */
export class MailtrapChannel extends MailChannel {
  private readonly client: MailtrapClient;
  private readonly mailtrapConfig: MailtrapConfig;

  constructor(config: MailtrapConfig) {
    super(config, 'Mailtrap');
    this.mailtrapConfig = config;
    this.client = new MailtrapClient({
      token: config.token,
      ...(config.endpoint && { endpoint: config.endpoint }),
    });
  }

  /**
   * Validate configuration
   */
  protected validateConfig(): void {
    if (!this.config.token) {
      throw new NotificationConfigurationException('API token is required for Mailtrap', {
        channel: 'Mailtrap',
      });
    }
  }

  /**
   * Send an email notification
   */
  async sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
    try {
      // Validate recipients
      Logger.debug('SENDING MAILTRAP MAIL', request);
      const recipients = Array.isArray(request.to) ? request.to : [request.to];
      for (const recipient of recipients) {
        const email = typeof recipient === 'string' ? recipient : recipient.email;
        if (!isValidEmail(email)) {
          throw new NotificationConfigurationException(`Invalid email address: ${email}`, {
            email,
          });
        }
      }

      // Prepare email data
      const emailData = MailtrapMapper.toMailtrapData(request, this.mailtrapConfig);

      // Send email
      const response = await this.client.send(emailData);

      Logger.debug('Mailtrap Raw Response', {
        success: response.success,
        messageIds: response.message_ids,
      });

      if (!response.success) {
        // Though the client usually throws on failure, this checks explicit success flag if present/returned without throw
        throw new NotificationInvalidResponseError(
          'Mailtrap API reported failure',
          undefined,
          response,
        );
      }

      // Return success response using mapper
      return MailtrapMapper.toSuccessResponse(response, request);
    } catch (error) {
      // Handle known error cases if any specific ones exist
      // Mailtrap client specific errors checking might be needed here

      if (error instanceof Error && error.message.includes('From email address is required')) {
        return {
          success: false,
          status: NotificationStatus.FAILED,
          messageId: '',
          error: {
            code: 'CONFIGURATION_ERROR',
            message: 'From email address is required',
          },
        } as any;
      }

      return this.handleError(error, 'Failed to send email with Mailtrap') as SendEmailResponse;
    }
  }

  /**
   * Handle errors and convert to standard notification response
   */
  private handleError(error: unknown, defaultMessage: string): SendEmailResponse {
    if (error instanceof Error) {
      // Try to safe access potential status code or other properties
      const anyError = error as any;

      return {
        messageId: '',
        status: NotificationStatus.FAILED,
        error: {
          code: 'MAILTRAP_ERROR',
          message: error.message || defaultMessage,
          details: {
            statusCode: anyError.statusCode || anyError.status,
            error: error,
          },
        },
      };
    }

    return {
      messageId: '',
      status: NotificationStatus.FAILED,
      error: {
        code: 'UNKNOWN_ERROR',
        message: defaultMessage,
        details: error,
      },
    };
  }
}

/**
 * Factory function to create a Mailtrap channel
 */
export function createMailtrapChannel(config: MailtrapConfig): MailtrapChannel {
  return new MailtrapChannel(config);
}
