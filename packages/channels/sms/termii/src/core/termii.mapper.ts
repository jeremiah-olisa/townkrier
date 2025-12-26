import {
  SendSmsRequest,
  SendSmsResponse,
  NotificationStatus,
  sanitizeMetadata,
  generateReference,
} from '@townkrier/core';
import { TermiiSmsData, TermiiApiResponse } from '../interfaces';
import { TermiiConfig } from '../types';

export class TermiiMapper {
  static toTermiiData(request: SendSmsRequest, config: TermiiConfig): TermiiSmsData {
    // Determine sender ID
    const from = String(config.from);

    if (!from) {
      throw new Error('Sender ID (from) is required for Termii');
    }

    // Termii specific: "to" must be a single number for this en0]dpoint usually,
    // but our abstraction might handle arrays. The basic Termii /send endpoint takes one "to".
    // We will assume the Channel handles iteration or this mapper handles single request.
    // Let's assume single recipient for the prompt, but if request has multiple, the channel loops.
    // So this mapper maps ONE request context.

    // Warning: request.to is NotificationRecipient | NotificationRecipient[]
    // We'll take the first one or assume the channel passes a normalized request.
    // Ideally the channel iterates.
    const recipients = Array.isArray(request.to) ? request.to : [request.to];
    // TODO: Handle multiple recipients
    const to = recipients[0].phone; // Naive, but Termii API is 1-to-1 typically.

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
