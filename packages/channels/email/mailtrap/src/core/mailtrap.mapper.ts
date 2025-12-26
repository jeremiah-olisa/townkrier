import {
  SendEmailRequest,
  SendEmailResponse,
  NotificationStatus,
  sanitizeMetadata,
  generateReference,
} from '@townkrier/core';
import { MailtrapConfig } from '../types';
import { MailtrapEmailData, MailtrapApiResponse } from '../interfaces';

export class MailtrapMapper {
  static toMailtrapData(request: SendEmailRequest, config: MailtrapConfig): MailtrapEmailData {
    const fromEmail = request.from?.email || config.from;
    const fromName = request.from?.name || config.fromName;

    if (!fromEmail) {
      throw new Error('From email address is required');
    }

    const recipients = Array.isArray(request.to) ? request.to : [request.to];

    const emailData: MailtrapEmailData = {
      from: {
        email: fromEmail,
        name: fromName,
      },
      to: recipients.map((r) => this.mapRecipient(r)),
      subject: request.subject,
      html: request.html,
      text: request.text || request.html || request.subject, // Ensure text is present
    };

    if (request.cc && request.cc.length > 0) {
      emailData.cc = request.cc.map((r) => this.mapRecipient(r));
    }

    if (request.bcc && request.bcc.length > 0) {
      emailData.bcc = request.bcc.map((r) => this.mapRecipient(r));
    }

    if (request.attachments && request.attachments.length > 0) {
      emailData.attachments = request.attachments
        .filter((att) => att.content !== undefined)
        .map((att) => ({
          filename: att.filename,
          content: att.content!,
          // Mailtrap client handles Buffer/string content generally
        }));
    }

    // Add custom variables from metadata if available
    if (request.metadata) {
      const sanitized = sanitizeMetadata(request.metadata);
      if (sanitized) {
        // Mailtrap uses custom_variables, simpler than tags array in some other providers
        // But let's check exact type, usually it's string values
        const variables: Record<string, string> = {};
        Object.entries(sanitized).forEach(([key, value]) => {
          variables[key] = String(value);
        });
        emailData.custom_variables = variables;
      }
    }

    return emailData;
  }

  private static mapRecipient(recipient: { email: string; name?: string } | string): {
    email: string;
    name?: string;
  } {
    if (typeof recipient === 'string') {
      return { email: recipient };
    }
    return {
      email: recipient.email,
      name: recipient.name,
    };
  }

  static toSuccessResponse(
    data: MailtrapApiResponse,
    request: SendEmailRequest,
  ): SendEmailResponse {
    return {
      // Mailtrap can return multiple message IDs if batch sending, but SendEmailRequest structure usually implies single logical send or we take the first
      messageId: data.message_ids[0] || '',
      reference: request.reference || generateReference('EMAIL'),
      status: NotificationStatus.SENT,
      sentAt: new Date(),
      metadata: request.metadata,
      raw: data,
    };
  }
}
