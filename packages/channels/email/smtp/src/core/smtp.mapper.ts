import {
  SendEmailRequest,
  SendEmailResponse,
  NotificationStatus,
  generateReference,
} from '@townkrier/core';
import { SmtpConfig } from '../types';
import { SmtpEmailData, SmtpApiResponse } from '../interfaces';

export class SmtpMapper {
  static toSmtpData(request: SendEmailRequest, config: SmtpConfig): SmtpEmailData {
    const from = request.from
      ? `${request.from.name ? `${request.from.name} <${request.from.email}>` : request.from.email}`
      : config.from
        ? `${config.fromName ? `${config.fromName} <${config.from}>` : config.from}`
        : '';

    if (!from) {
      throw new Error('From email address is required');
    }

    const recipients = Array.isArray(request.to) ? request.to : [request.to];
    const to = recipients.map((r) => (r.name ? `${r.name} <${r.email}>` : r.email));

    const emailData: SmtpEmailData = {
      from,
      to,
      subject: request.subject,
      html: request.html,
      text: request.text || request.html || request.subject,
    };

    if (request.cc && request.cc.length > 0) {
      emailData.cc = request.cc.map((r) => (r.name ? `${r.name} <${r.email}>` : r.email));
    }

    if (request.bcc && request.bcc.length > 0) {
      emailData.bcc = request.bcc.map((r) => (r.name ? `${r.name} <${r.email}>` : r.email));
    }

    if (request.replyTo) {
      emailData.replyTo = request.replyTo.name
        ? `${request.replyTo.name} <${request.replyTo.email}>`
        : request.replyTo.email;
    }

    if (request.attachments && request.attachments.length > 0) {
      emailData.attachments = request.attachments
        .filter((att) => att.content !== undefined)
        .map((att) => ({
          filename: att.filename,
          content: att.content,
          path: att.path,
          contentType: att.contentType,
          cid: undefined, // Nodemailer uses cid for embedded images if needed
        }));
    }

    // Nodemailer supports headers property for custom headers/metadata
    if (request.metadata) {
      // We can iterate and add X-Headers
      // Or simplify implementation. For now, skipping explicit metadata -> header map unless specific requirement.
    }

    return emailData;
  }

  static toSuccessResponse(data: SmtpApiResponse, request: SendEmailRequest): SendEmailResponse {
    return {
      messageId: data.messageId,
      reference: request.reference || generateReference('EMAIL'),
      status: NotificationStatus.SENT,
      sentAt: new Date(),
      metadata: request.metadata,
      raw: data,
    };
  }
}
