import {
  SendEmailRequest,
  SendEmailResponse,
  NotificationStatus,
  generateReference,
  sanitizeMetadata,
} from '@townkrier/core';
import { PostmarkConfig } from '../types';
import { PostmarkEmailData, PostmarkApiResponse } from '../interfaces';

export class PostmarkMapper {
  static toPostmarkData(request: SendEmailRequest, config: PostmarkConfig): PostmarkEmailData {
    const from = request.from
      ? `${request.from.name ? `${request.from.name} <${request.from.email}>` : request.from.email}`
      : config.from || '';

    if (!from) {
      throw new Error('From email address is required');
    }

    const recipients = Array.isArray(request.to) ? request.to : [request.to];
    const to = recipients.map((r) => (r.name ? `${r.name} <${r.email}>` : r.email)).join(',');

    const emailData: PostmarkEmailData = {
      From: from,
      To: to,
      Subject: request.subject,
      HtmlBody: request.html,
      TextBody: request.text || request.html || request.subject,
    };

    if (request.cc && request.cc.length > 0) {
      emailData.Cc = request.cc.map((r) => (r.name ? `${r.name} <${r.email}>` : r.email)).join(',');
    }

    if (request.bcc && request.bcc.length > 0) {
      emailData.Bcc = request.bcc
        .map((r) => (r.name ? `${r.name} <${r.email}>` : r.email))
        .join(',');
    }

    if (request.replyTo) {
      emailData.ReplyTo = request.replyTo.name
        ? `${request.replyTo.name} <${request.replyTo.email}>`
        : request.replyTo.email;
    }

    if (request.attachments && request.attachments.length > 0) {
      emailData.Attachments = request.attachments
        .filter((att) => att.content !== undefined)
        .map((att) => ({
          Name: att.filename,
          Content: Buffer.isBuffer(att.content)
            ? att.content.toString('base64')
            : Buffer.from(att.content!).toString('base64'),
          ContentType: att.contentType || 'application/octet-stream',
          ContentID: null,
        }));
    }

    if (request.metadata) {
      const sanitized = sanitizeMetadata(request.metadata);
      if (sanitized) {
        // Postmark metadata values must be strings
        const metadata: Record<string, string> = {};
        Object.entries(sanitized).forEach(([key, value]) => {
          metadata[key] = String(value);
        });
        emailData.Metadata = metadata;
      }
    }

    return emailData;
  }

  static toSuccessResponse(
    data: PostmarkApiResponse,
    request: SendEmailRequest,
  ): SendEmailResponse {
    return {
      messageId: data.MessageID,
      reference: request.reference || generateReference('EMAIL'),
      status: NotificationStatus.SENT,
      sentAt: new Date(data.SubmittedAt),
      metadata: request.metadata,
      raw: data,
    };
  }
}
