import {
  EmailRecipient,
  SmsRecipient,
  PushRecipient,
  InAppRecipient,
  NotificationMetadata,
  Attachment,
  NotificationPriority,
  NotificationChannel,
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
/**
 * Email content definition
 */
export interface EmailContent {
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
   * Template to use for rendering
   */
  template?: string;

  /**
   * Context data for template rendering
   */
  context?: Record<string, unknown>;

  /**
   * Sender email address override
   */
  from?: EmailRecipient;

  /**
   * Reply-to email
   */
  replyTo?: EmailRecipient;

  /**
   * CC recipients
   */
  cc?: EmailRecipient[];

  /**
   * BCC recipients
   */
  bcc?: EmailRecipient[];

  /**
   * Attachments
   */
  attachments?: Attachment[];
}

/**
 * Email notification request
 */
export interface SendEmailRequest extends BaseNotificationRequest, EmailContent {
  /**
   * Sender email address (Required for request if not in config, but declared in Content as optional override)
   * Re-declaring 'from' to match BaseNotificationRequest pattern if needed, but here we just merge properties.
   * However, 'from' in Content is for the Notification class to specify overrides.
   * In the Request context, it might be populated from config or content.
   */
  from: EmailRecipient;

  /**
   * Recipient(s)
   */
  to: EmailRecipient | EmailRecipient[];
}

/**
 * SMS content definition
 */
export interface SmsContent {
  /**
   * SMS message text
   */
  text: string;

  /**
   * Sender ID or phone number override
   */
  from?: string;
}

/**
 * SMS notification request
 */
export interface SendSmsRequest extends BaseNotificationRequest, SmsContent {
  /**
   * Recipient(s)
   */
  to: SmsRecipient | SmsRecipient[];
}

/**
 * Push notification content definition
 */
export interface PushContent {
  /**
   * Notification title
   */
  title: string;

  /**
   * Notification body
   */
  body: string;

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
 * Push notification request
 */
export interface SendPushRequest extends Omit<BaseNotificationRequest, 'title'>, PushContent {
  /**
   * Recipient(s)
   */
  to: PushRecipient | PushRecipient[];
}

/**
 * In-app notification content definition
 */
export interface InAppContent {
  /**
   * Notification title
   */
  title: string;

  /**
   * Notification message
   */
  message: string;

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

/**
 * In-app notification request
 */
export interface SendInAppRequest extends Omit<BaseNotificationRequest, 'title'>, InAppContent {
  /**
   * Recipient user ID(s)
   */
  to: InAppRecipient | InAppRecipient[];
}

/**
 * Recipient details for database-only delivery.
 * Stores and associates the notification with a specific record or user.
 */
export type DatabaseRecipient = {
  id: string;
};

/**
 * Defines a flexible recipient structure keyed by notification channel.
 * Each channel is optional, allowing a notification to target one or more delivery paths.
 */
export type NotificationRecipient = {
  [NotificationChannel.EMAIL]?: EmailRecipient | unknown;
  [NotificationChannel.SMS]?: SmsRecipient | unknown;
  [NotificationChannel.PUSH]?: PushRecipient | unknown;
  [NotificationChannel.IN_APP]?: InAppRecipient | unknown;
  [NotificationChannel.SLACK]?: unknown;
  [NotificationChannel.DATABASE]?: DatabaseRecipient | unknown;
  [key: string]: unknown;
};
