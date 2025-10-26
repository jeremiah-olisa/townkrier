import {
  EmailRecipient,
  SmsRecipient,
  PushRecipient,
  InAppRecipient,
  NotificationMetadata,
  Attachment,
  NotificationPriority,
} from '../types';

/**
 * Base notification request
 */
export interface BaseNotificationRequest {
  /**
   * Notification title
   */
  title?: string;

  /**
   * Notification message/body
   */
  message: string;

  /**
   * Additional metadata
   */
  metadata?: NotificationMetadata;

  /**
   * Priority level
   */
  priority?: NotificationPriority;

  /**
   * Unique reference for this notification
   */
  reference?: string;
}

/**
 * Email notification request
 */
export interface SendEmailRequest extends BaseNotificationRequest {
  /**
   * Sender email address
   */
  from: EmailRecipient;

  /**
   * Recipient(s)
   */
  to: EmailRecipient | EmailRecipient[];

  /**
   * CC recipients
   */
  cc?: EmailRecipient[];

  /**
   * BCC recipients
   */
  bcc?: EmailRecipient[];

  /**
   * Email subject
   */
  subject: string;

  /**
   * Email body (plain text)
   */
  text?: string;

  /**
   * Email body (HTML)
   */
  html?: string;

  /**
   * Reply-to email
   */
  replyTo?: EmailRecipient;

  /**
   * Attachments
   */
  attachments?: Attachment[];
}

/**
 * SMS notification request
 */
export interface SendSmsRequest extends BaseNotificationRequest {
  /**
   * Sender ID or phone number
   */
  from?: string;

  /**
   * Recipient(s)
   */
  to: SmsRecipient | SmsRecipient[];

  /**
   * SMS message text
   */
  text: string;
}

/**
 * Push notification request
 */
export interface SendPushRequest extends BaseNotificationRequest {
  /**
   * Notification title
   */
  title: string;

  /**
   * Notification body
   */
  body: string;

  /**
   * Recipient(s)
   */
  to: PushRecipient | PushRecipient[];

  /**
   * Image URL for rich notifications
   */
  imageUrl?: string;

  /**
   * Action URL or deep link
   */
  actionUrl?: string;

  /**
   * Notification icon
   */
  icon?: string;

  /**
   * Sound to play
   */
  sound?: string;

  /**
   * Badge count (iOS)
   */
  badge?: number;

  /**
   * Additional data payload
   */
  data?: NotificationMetadata;
}

/**
 * In-app notification request
 */
export interface SendInAppRequest extends BaseNotificationRequest {
  /**
   * Recipient user ID(s)
   */
  to: InAppRecipient | InAppRecipient[];

  /**
   * Notification title
   */
  title: string;

  /**
   * Notification type/category
   */
  type?: string;

  /**
   * Action URL
   */
  actionUrl?: string;

  /**
   * Icon or avatar URL
   */
  icon?: string;

  /**
   * Additional data
   */
  data?: NotificationMetadata;
}
