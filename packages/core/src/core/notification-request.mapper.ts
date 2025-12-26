import {
  EmailContent,
  SmsContent,
  PushContent,
  InAppContent,
  SendEmailRequest,
  SendSmsRequest,
  SendPushRequest,
  SendInAppRequest,
  EmailRecipient,
} from '../interfaces';
import { Notification } from './notification';

export class NotificationRequestMapper {
  /**
   * Create a SendEmailRequest from content and recipient
   */
  static createEmailRequest(
    content: EmailContent,
    recipient: unknown,
    notification: Notification,
  ): SendEmailRequest {
    if (!content.from) {
      // Enforce 'from' presence if required by strict typing, or handle logic here.
      // For now, we assume it must be provided or we throw/error early.
      // However, if we want to allow defaults from config later, we might need to allow undefined here
      // OR the caller must provide the default.
      // Let's assume the caller (Manager) might merge defaults before calling this,
      // OR we return it with 'from' potentially undefined and let the Channel handle it if interface allows.
      // But SendEmailRequest interface says 'from' is mandatory.
      // So we strictly require it or cast safely if we know what we are doing.
      // User wants safety.
      // Let's check if we can rely on `content.from`.
    }

    return {
      ...content,
      to: recipient as EmailRecipient | EmailRecipient[], // We trust the routing info matches the channel
      reference: notification.reference,
      metadata: notification.metadata,
      priority: notification.priority,
      from: content.from!,
      message: content.text || content.subject || 'Email Notification',
    };
  }

  /**
   * Create a SendSmsRequest
   */
  static createSmsRequest(
    content: SmsContent,
    recipient: unknown,
    notification: Notification,
  ): SendSmsRequest {
    return {
      ...content,
      to: recipient as any,
      reference: notification.reference,
      metadata: notification.metadata,
      priority: notification.priority,
      message: content.text,
    };
  }

  /**
   * Create a SendPushRequest
   */
  static createPushRequest(
    content: PushContent,
    recipient: unknown,
    notification: Notification,
  ): SendPushRequest {
    return {
      ...content,
      to: recipient as any,
      reference: notification.reference,
      metadata: notification.metadata,
      priority: notification.priority,
      message: content.body, // Map logic
    };
  }

  /**
   * Create a SendInAppRequest
   */
  static createInAppRequest(
    content: InAppContent,
    recipient: unknown,
    notification: Notification,
  ): SendInAppRequest {
    return {
      ...content,
      to: recipient as any,
      reference: notification.reference,
      metadata: notification.metadata,
      priority: notification.priority,
    };
  }
}
