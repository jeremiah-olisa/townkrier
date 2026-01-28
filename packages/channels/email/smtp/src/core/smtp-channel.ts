import * as nodemailer from 'nodemailer';
import {
  MailChannel,
  SendEmailRequest,
  SendEmailResponse,
  NotificationStatus,
  NotificationConfigurationException,
  isValidEmail,
  Logger,
} from 'townkrier-core';

import { SmtpConfig } from '../types';
import { SmtpMapper } from './smtp.mapper';

export class SmtpChannel extends MailChannel {
  private transporter: nodemailer.Transporter;

  constructor(config: SmtpConfig) {
    if (!config.host || !config.port) {
      throw new NotificationConfigurationException('Host and Port are required for SMTP', {
        channel: 'SMTP',
      });
    }

    super(config, 'SMTP');
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure ?? false, // true for 465, false for other ports
      auth: config.auth,
    });
  }

  async sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
    try {
      Logger.debug('SENDING SMTP MAIL', request);
      const recipients = Array.isArray(request.to) ? request.to : [request.to];
      for (const recipient of recipients) {
        const email = typeof recipient === 'string' ? recipient : recipient.email;
        if (!isValidEmail(email)) {
          throw new NotificationConfigurationException(`Invalid email address: ${email}`, {
            email,
          });
        }
      }

      const emailData = SmtpMapper.toSmtpData(request, this.config as SmtpConfig);

      const info = await this.transporter.sendMail(emailData);

      Logger.debug('SMTP Raw Response', info);

      return SmtpMapper.toSuccessResponse(info, request);
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

      return this.handleError(error, 'Failed to send email with SMTP') as SendEmailResponse;
    }
  }

  private handleError(error: unknown, defaultMessage: string): SendEmailResponse {
    const code = 'SMTP_ERROR';
    let message = defaultMessage;

    if (error instanceof Error) {
      message = error.message;
      // Check for specific nodemailer error codes if possible, usually it just throws Error object
    }

    return {
      messageId: '',
      status: NotificationStatus.FAILED,
      error: {
        code,
        message,
        details: error,
      },
    };
  }
}

export function createSmtpChannel(config: SmtpConfig): SmtpChannel {
  return new SmtpChannel(config);
}
