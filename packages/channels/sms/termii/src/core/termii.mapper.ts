import {
  SendSmsRequest,
  SendSmsResponse,
  NotificationStatus,
  sanitizeMetadata,
  generateReference,
} from 'townkrier-core';
import { TermiiSmsData, TermiiApiResponse } from '../interfaces';
import { TermiiConfig } from '../types';

export class TermiiMapper {
  static toTermiiData(request: SendSmsRequest, config: TermiiConfig): TermiiSmsData {
    // Determine sender ID
    const from = String(config.from);

    if (!from) {
      throw new Error('Sender ID (from) is required for Termii');
    }

    // Map recipients to single string or array of strings
    const recipients = Array.isArray(request.to) ? request.to : [request.to];
    const to = recipients.length > 1 ? recipients.map((r) => r.phone) : recipients[0]?.phone;

    if (!to || (Array.isArray(to) && to.length === 0)) {
      throw new Error('Recipient (to) is required');
    }

    return {
      to,
      from,
      sms: request.message,
      type: 'plain',
      channel: 'generic',
      api_key: config.apiKey,
    };
  }

  static toSuccessResponse(data: TermiiApiResponse, request: SendSmsRequest): SendSmsResponse {
    const reference = request.reference || generateReference('SMS');
    // Termii response example: { message_id: "...", ... }
    const messageId = data.message_id || '';

    return {
      messageId,
      reference,
      status: NotificationStatus.SENT,
      sentAt: new Date(),
      units: data.balance ? 1 : undefined, // Rough approximation or use balance diff if tracked
      metadata: sanitizeMetadata(request.metadata),
      raw: data,
    };
  }

  static toErrorResponse(error: unknown, defaultMessage: string): SendSmsResponse {
    if (error instanceof Error) {
      return {
        messageId: '',
        status: NotificationStatus.FAILED,
        error: {
          code: 'TERMII_ERROR',
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
