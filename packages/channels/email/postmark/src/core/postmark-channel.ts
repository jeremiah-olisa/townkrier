import { ServerClient } from 'postmark';
import {
  MailChannel,
  SendEmailRequest,
  SendEmailResponse,
  NotificationStatus,
  NotificationConfigurationException,
  NotificationInvalidResponseError,
  isValidEmail,
  Logger,
} from '@townkrier/core';

import { PostmarkConfig } from '../types';
import { PostmarkMapper } from './postmark.mapper';

export class PostmarkChannel extends MailChannel {
  private readonly client: ServerClient;

  constructor(config: PostmarkConfig) {
    super(config, 'Postmark');
    this.client = new ServerClient(config.serverToken);
  }

  protected validateConfig(): void {
    if (!this.config.serverToken) {
      throw new NotificationConfigurationException('Server Token is required for Postmark', {
        channel: 'Postmark',
      });
    }
  }

  async sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
    try {
      Logger.debug('SENDING POSTMARK MAIL', request);
      const recipients = Array.isArray(request.to) ? request.to : [request.to];
      for (const recipient of recipients) {
        const email = typeof recipient === 'string' ? recipient : recipient.email;
        if (!isValidEmail(email)) {
          throw new NotificationConfigurationException(`Invalid email address: ${email}`, {
            email,
          });
        }
      }

      const emailData = PostmarkMapper.toPostmarkData(request, this.config as PostmarkConfig);

      const response = await this.client.sendEmail(emailData);

      Logger.debug('Postmark Raw Response', response);

      if (response.ErrorCode !== 0) {
        throw new NotificationInvalidResponseError(
          `Postmark Error ${response.ErrorCode}: ${response.Message}`,
          undefined,
          response,
        );
      }

      return PostmarkMapper.toSuccessResponse(response, request);
    } catch (error) {
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

      return this.handleError(error, 'Failed to send email with Postmark') as SendEmailResponse;
    }
  }

  private handleError(error: unknown, defaultMessage: string): SendEmailResponse {
    if (error instanceof Error) {
      // Check for specific Postmark error structure if available, usually generic Error from client
      return {
        messageId: '',
        status: NotificationStatus.FAILED,
        error: {
          code: 'POSTMARK_ERROR',
          message: error.message || defaultMessage,
          details: error,
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

export function createPostmarkChannel(config: PostmarkConfig): PostmarkChannel {
  return new PostmarkChannel(config);
}
