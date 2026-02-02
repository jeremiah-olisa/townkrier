import {
  SendPushRequest,
  SendPushResponse,
  NotificationStatus,
  generateReference,
  sanitizeMetadata,
} from 'townkrier-core';
import { ExpoMessage } from '../interfaces';
import { ExpoSendResponse, ExpoTicketResponse } from '../types';

/**
 * Maps Townkrier push requests to Expo push messages
 */
export class ExpoMapper {
  /**
   * Convert Townkrier SendPushRequest to Expo push message format
   */
  static toExpoMessage(request: SendPushRequest): ExpoMessage {
    return {
      to: this.extractDeviceTokens(request.to),
      title: request.title,
      body: request.body,
      data: request.data,
      sound: request.sound || 'default',
      badge: request.badge,
      priority: this.mapPriority(request.priority),
    };
  }

  /**
   * Extract device tokens from recipients
   */
  private static extractDeviceTokens(to: any): string | string[] {
    if (Array.isArray(to)) {
      return to.map((recipient: any) => recipient.deviceToken);
    }
    return to.deviceToken;
  }

  /**
   * Map priority to Expo priority levels
   */
  private static mapPriority(priority?: string): 'default' | 'normal' | 'high' {
    if (priority === 'high' || priority === 'urgent') return 'high';
    if (priority === 'low') return 'normal';
    return 'default';
  }

  /**
   * Convert Expo tickets to SendPushResponse
   */
  static toSuccessResponse(
    expoResponse: ExpoSendResponse,
    request: SendPushRequest,
  ): SendPushResponse {
    const reference = request.reference || generateReference('EXPO');
    const firstTicket = expoResponse.tickets[0];

    return {
      messageId: firstTicket?.id || reference,
      reference,
      status: expoResponse.successCount > 0 ? NotificationStatus.SENT : NotificationStatus.FAILED,
      sentAt: new Date(),
      metadata: sanitizeMetadata(request.metadata),
      raw: {
        successCount: expoResponse.successCount,
        failureCount: expoResponse.failureCount,
        tickets: expoResponse.tickets,
      },
    };
  }

  /**
   * Convert error to SendPushResponse
   */
  static toErrorResponse(error: unknown, message: string): SendPushResponse {
    const errorMessage =
      error instanceof Error ? error.message : typeof error === 'string' ? error : message;

    return {
      messageId: '',
      reference: generateReference('EXPO_ERR'),
      status: NotificationStatus.FAILED,
      sentAt: new Date(),
      error: {
        code: 'EXPO_ERROR',
        message: errorMessage,
        details: error instanceof Error ? { stack: error.stack } : { error },
      },
    };
  }

  /**
   * Convert Expo ticket response to ExpoTicketResponse
   */
  static normalizeTicket(ticket: any): ExpoTicketResponse {
    return {
      id: ticket.id,
      status: ticket.status === 'ok' ? 'ok' : 'error',
      message: ticket.message,
      details: ticket.details,
    };
  }
}
