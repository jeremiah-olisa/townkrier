import {
  SendEmailRequest,
  SendEmailResponse,
  NotificationStatus,
  sanitizeMetadata,
  generateReference,
} from '@townkrier/core';
import { ResendConfig } from '../types';
import { ResendEmailData, ResendApiResponse } from '../interfaces';

export class ResendMapper {
  static toResendData(request: SendEmailRequest, config: ResendConfig): ResendEmailData {
    const from = request.from
      ? `${request.from.name ? `${request.from.name} <${request.from.email}>` : request.from.email}`
      : config.from
        ? `${config.fromName ? `${config.fromName} <${config.from}>` : config.from}`
        : '';

    if (!from) {
      throw new Error('From email address is required');
    }

    const recipients = Array.isArray(request.to) ? request.to : [request.to];

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

    return emailData;
  }

  static toChannelResponse(data: unknown): ResendApiResponse {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response data from Resend');
    }

    const response = data as Record<string, unknown>;

    if (!response.id || typeof response.id !== 'string') {
      throw new Error('Invalid response: missing id');
    }

    // resend sdk response might not have created_at in some versions or mock, handle gracefully or strictly
    // Assuming standard Resend API response structure
    return {
      id: response.id as string,
      created_at:
        typeof response.created_at === 'string' ? response.created_at : new Date().toISOString(),
      to: Array.isArray(response.to) ? (response.to as string[]) : [response.to as string],
      from: response.from as string,
      subject: response.subject as string,
      html: response.html as string,
      text: response.text as string,
      cc: Array.isArray(response.cc)
        ? (response.cc as string[])
        : response.cc
          ? [response.cc as string]
          : [],
      bcc: Array.isArray(response.bcc)
        ? (response.bcc as string[])
        : response.bcc
          ? [response.bcc as string]
          : [],
      reply_to:
        typeof response.reply_to === 'string'
          ? [response.reply_to]
          : (response.reply_to as string[] | undefined),
    };
  }
  static toSuccessResponse(data: ResendApiResponse, request: SendEmailRequest): SendEmailResponse {
    return {
      messageId: data.id,
      reference: request.reference || generateReference('EMAIL'), // Will need to import generateReference? It's imported in Mapper file? No, it's not.
      status: NotificationStatus.SENT,
      sentAt: new Date(data.created_at),
      metadata: request.metadata,
      raw: data, // raw expects unknown, ResendApiResponse is fine
    };
  }
}
