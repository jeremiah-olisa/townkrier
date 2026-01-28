import * as admin from 'firebase-admin';
import {
  SendPushRequest,
  SendPushResponse,
  NotificationStatus,
  sanitizeMetadata,
  generateReference,
} from 'townkrier-core';
import { FcmMessageData, FcmSendResponse } from '../interfaces';

export class FcmMapper {
  static toFcmMessage(request: SendPushRequest): FcmMessageData {
    const { metadata = {} } = request;

    // Extract common platform specific options from metadata
    const channelId = metadata.channelId as string | undefined;
    const ttl = metadata.ttl !== undefined ? Number(metadata.ttl) : undefined;
    const collapseKey = metadata.collapseKey as string | undefined;

    const message: FcmMessageData = {
      notification: {
        title: request.title,
        body: request.body,
      },
    };

    // Android Config
    message.android = {
      // Priority mapping
      priority: request.priority === 'urgent' || request.priority === 'high' ? 'high' : 'normal',
      // TTL and Collapse Key
      ttl: ttl ? ttl * 1000 : undefined, // FCM expects milliseconds
      collapseKey,
      notification: {
        icon: request.icon,
        sound: request.sound,
        channelId: channelId,
        imageUrl: request.imageUrl, // Redundant but good for some Android versions
        clickAction: request.actionUrl, // Common way to handle clicks on Android
      },
      data: request.data as Record<string, string>,
    };

    // iOS (APNs) Config
    message.apns = {
      headers: {
        'apns-priority': request.priority === 'urgent' || request.priority === 'high' ? '10' : '5',
        ...(collapseKey && { 'apns-collapse-id': collapseKey }),
      },
      payload: {
        aps: {
          alert: {
            title: request.title,
            body: request.body,
          },
          ...(request.sound && { sound: request.sound }),
          ...(request.badge !== undefined && { badge: request.badge }),
          'mutable-content': 1, // Enable rich notifications (images)
        },
      },
      fcmOptions: {
        imageUrl: request.imageUrl,
      },
    };

    // WebPush Config
    message.webpush = {
      headers: {
        Urgency: request.priority === 'urgent' || request.priority === 'high' ? 'high' : 'normal',
        ...(ttl && { TTL: String(ttl) }),
      },
      notification: {
        title: request.title,
        body: request.body,
        icon: request.icon,
        image: request.imageUrl,
        data: request.data,
        // Standard Web Push link
        ...(request.actionUrl && {
          data: {
            ...(request.data || {}),
            url: request.actionUrl,
          },
        }),
      },
      fcmOptions: {
        link: request.actionUrl,
      },
    };

    // Common Data Payload
    // Ensure data values are strings for FCM compatibility
    if (request.data) {
      message.data = Object.entries(request.data).reduce(
        (acc, [key, value]) => {
          acc[key] = String(value);
          return acc;
        },
        {} as Record<string, string>,
      );

      // Also add actionUrl to data if present, for custom handling
      if (request.actionUrl) {
        message.data.actionUrl = request.actionUrl;
      }
    } else if (request.actionUrl) {
      message.data = { actionUrl: request.actionUrl };
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
