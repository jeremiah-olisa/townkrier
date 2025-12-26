import * as admin from 'firebase-admin';
import {
  SendPushRequest,
  SendPushResponse,
  NotificationStatus,
  sanitizeMetadata,
  generateReference,
} from '@townkrier/core';
import { FcmMessageData, FcmSendResponse } from '../interfaces';

export class FcmMapper {
  static toFcmMessage(request: SendPushRequest): FcmMessageData {
    const message: FcmMessageData = {
      notification: {
        title: request.title,
        body: request.body,
        imageUrl: request.imageUrl,
      },
    };

    if (request.icon || request.sound || request.badge) {
      message.android = {
        priority: request.priority === 'urgent' || request.priority === 'high' ? 'high' : 'normal',
        notification: {
          icon: request.icon,
          sound: request.sound,
        },
      };

      if (request.sound || request.badge) {
        message.apns = {
          payload: {
            aps: {
              ...(request.sound && { sound: request.sound }),
              ...(request.badge !== undefined && { badge: request.badge }),
            },
          },
        };
      }

      message.webpush = {
        notification: {
          icon: request.icon,
        },
      };
    }

    if (request.data) {
      message.data = Object.entries(request.data).reduce(
        (acc, [key, value]) => {
          acc[key] = String(value);
          return acc;
        },
        {} as Record<string, string>,
      );
    }

    if (request.actionUrl) {
      if (!message.data) message.data = {};
      message.data.actionUrl = request.actionUrl;
    }

    return message;
  }

  static toChannelResponse(result: admin.messaging.BatchResponse | string): FcmSendResponse {
    if (typeof result === 'string') {
      return {
        successCount: 1,
        failureCount: 0,
        responses: [
          {
            success: true,
            messageId: result,
          },
        ],
      };
    }

    return {
      successCount: result.successCount,
      failureCount: result.failureCount,
      responses: result.responses.map((r) => ({
        success: r.success,
        messageId: r.messageId,
        error: r.error
          ? {
              code: r.error.code,
              message: r.error.message,
            }
          : undefined,
      })),
    };
  }

  static toSuccessResponse(data: FcmSendResponse, request: SendPushRequest): SendPushResponse {
    const reference = request.reference || generateReference('PUSH');
    const messageId = data.responses[0]?.messageId || '';

    return {
      messageId,
      reference,
      status: data.successCount > 0 ? NotificationStatus.SENT : NotificationStatus.FAILED,
      sentAt: new Date(),
      successCount: data.successCount,
      failureCount: data.failureCount,
      metadata: sanitizeMetadata(request.metadata),
      raw: data,
    };
  }

  static toErrorResponse(error: unknown, defaultMessage: string): SendPushResponse {
    if (error instanceof Error) {
      const fcmError = error as Error & { code?: string };

      return {
        messageId: '',
        status: NotificationStatus.FAILED,
        successCount: 0,
        failureCount: 1,
        error: {
          code: fcmError.code || 'FCM_ERROR',
          message: error.message || defaultMessage,
          details: error,
        },
      };
    }

    return {
      messageId: '',
      status: NotificationStatus.FAILED,
      successCount: 0,
      failureCount: 1,
      error: {
        code: 'UNKNOWN_ERROR',
        message: defaultMessage,
        details: error,
      },
    };
  }
}
