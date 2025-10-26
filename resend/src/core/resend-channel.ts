import { Resend as ResendClient } from 'resend';
import {
  MailChannel,
  SendEmailRequest,
  SendEmailResponse,
  NotificationStatus,
  NotificationConfigurationException,
  NotificationProviderException,
  NotificationInvalidResponseError,
  generateReference,
  isValidEmail,
  sanitizeMetadata,
} from '@townkrier/core';

import { ResendConfig } from '../types';
import { ResendEmailData, ResendApiResponse } from '../interfaces';

/**
 * Resend email channel implementation
 */
export class ResendChannel extends MailChannel {
  private readonly client: ResendClient;
  private readonly resendConfig: ResendConfig;

  constructor(config: ResendConfig) {
    if (!config.apiKey) {
      throw new NotificationConfigurationException('API key is required for Resend', {
        channel: 'Resend',
      });
    }

    super(config, 'Resend');
    this.resendConfig = config;
    this.client = new ResendClient(config.apiKey);
  }

  /**
   * Send an email notification
   */
  async sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
    try {
      // Validate recipients
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
      const from = request.from
        ? `${request.from.name ? `${request.from.name} <${request.from.email}>` : request.from.email}`
        : this.resendConfig.from
          ? `${this.resendConfig.fromName ? `${this.resendConfig.fromName} <${this.resendConfig.from}>` : this.resendConfig.from}`
          : '';

      if (!from) {
        throw new NotificationConfigurationException(
          'From email address is required',
          { channel: 'Resend' },
        );
      }

      const emailData: ResendEmailData = {
        from,
        to: recipients.map((r) => (r.name ? `${r.name} <${r.email}>` : r.email)),
        subject: request.subject,
        html: request.html,
        text: request.text || request.html || request.subject, // Ensure text is always defined
      };

      // Add optional fields
      if (request.cc && request.cc.length > 0) {
        emailData.cc = request.cc.map((r) => (r.name ? `${r.name} <${r.email}>` : r.email));
      }

      if (request.bcc && request.bcc.length > 0) {
        emailData.bcc = request.bcc.map((r) => (r.name ? `${r.name} <${r.email}>` : r.email));
      }

      if (request.replyTo) {
        emailData.reply_to = request.replyTo.name
          ? `${request.replyTo.name} <${request.replyTo.email}>`
          : request.replyTo.email;
      }

      if (request.attachments && request.attachments.length > 0) {
        emailData.attachments = request.attachments.map((att) => ({
          filename: att.filename,
          content: att.content,
          path: att.path,
        }));
      }

      // Add tags from metadata if available
      if (request.metadata) {
        const sanitized = sanitizeMetadata(request.metadata);
        if (sanitized) {
          emailData.tags = Object.entries(sanitized).map(([name, value]) => ({
            name,
            value: String(value),
          }));
        }
      }

      // Send email
      const response = await this.client.emails.send(emailData);

      if (!response.data) {
        throw new NotificationInvalidResponseError(
          'No response data from Resend',
          undefined,
          response,
        );
      }

      const data = response.data as ResendApiResponse;
      const reference = request.reference || generateReference('EMAIL');

      return {
        success: true,
        messageId: data.id,
        reference,
        status: NotificationStatus.SENT,
        sentAt: new Date(data.created_at),
        metadata: request.metadata,
        raw: response,
      };
    } catch (error) {
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
        success: false,
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
      success: false,
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
