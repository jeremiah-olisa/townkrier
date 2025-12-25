import { Resend as ResendClient } from 'resend';
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

import { ResendConfig } from '../types';
import { ResendMapper } from './resend.mapper';

/**
 * Resend email channel implementation
 */
export class ResendChannel extends MailChannel {
  private readonly resend: ResendClient;
  private readonly resendConfig: ResendConfig;

  constructor(config: ResendConfig) {
    if (!config.apiKey) {
      throw new NotificationConfigurationException('API key is required for Resend', {
        channel: 'Resend',
      });
    }

    super(config, 'Resend');
    this.resendConfig = config;
    this.resend = new ResendClient(config.apiKey);
  }

  /**
   * Send an email notification
   */
  async sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
    try {
      // Validate recipients
      Logger.debug('SENDING RESEND MAIL', request);
      const recipients = Array.isArray(request.to) ? request.to : [request.to];
      for (const recipient of recipients) {
        if (!isValidEmail(recipient.email)) {
          throw new NotificationConfigurationException(
            `Invalid email address: ${recipient.email}`,
            { email: recipient.email },
          );
        }
      }

      // Prepare email data
      const emailData = ResendMapper.toResendData(request, this.resendConfig);

      // Send email
      const response = await this.resend.emails.send(emailData);

      Logger.debug('Resend Raw Response', {
        hasData: !!response.data,
        hasError: !!response.error,
        keys: Object.keys(response),
        error: response.error,
      });

      if (response.error) {
        throw new NotificationInvalidResponseError(response.error.message, undefined, response);
      }

      if (!response.data) {
        throw new NotificationInvalidResponseError(
          'No response data from Resend',
          undefined,
          response,
        );
      }

      // Map raw response to typed response
      const apiResponse = ResendMapper.toChannelResponse(response.data);

      // Return success response using mapper
      return ResendMapper.toSuccessResponse(apiResponse, request);
    } catch (error) {
      if (error instanceof Error && error.message === 'From email address is required') {
        return {
          success: false, // Legacy field check
          status: NotificationStatus.FAILED,
          messageId: '',
          error: {
            code: 'CONFIGURATION_ERROR',
            message: 'From email address is required',
          },
        } as any; // Cast to satisfy mismatched return type if any
      }
      return this.handleError(error, 'Failed to send email') as SendEmailResponse;
    }
  }

  /**
   * Handle errors and convert to standard notification response
   */
  private handleError(error: unknown, defaultMessage: string): SendEmailResponse {
    if (error instanceof Error) {
      const resendError = error as Error & { statusCode?: number };

      return {
        messageId: '',
        status: NotificationStatus.FAILED,
        error: {
          code: 'RESEND_ERROR',
          message: error.message || defaultMessage,
          details: {
            statusCode: resendError.statusCode,
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
 * Factory function to create a Resend channel
 */
export function createResendChannel(config: ResendConfig): ResendChannel {
  return new ResendChannel(config);
}
