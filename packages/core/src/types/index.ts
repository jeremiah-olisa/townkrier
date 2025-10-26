/**
 * Notification channel types
 */
export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
  SLACK = 'slack',
  DATABASE = 'database',
}

/**
 * Notification status
 */
export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  READ = 'read',
}

/**
 * Notification priority levels
 */
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Email recipient details
 */
export interface EmailRecipient {
  email: string;
  name?: string;
}

/**
 * SMS recipient details
 */
export interface SmsRecipient {
  phone: string;
  name?: string;
}

/**
 * Push notification recipient details
 */
export interface PushRecipient {
  deviceToken: string;
  userId?: string;
  platform?: 'ios' | 'android' | 'web';
}

/**
 * In-app notification recipient
 */
export interface InAppRecipient {
  userId: string;
  email?: string;
}

/**
 * Generic notification metadata
 */
export type NotificationMetadata = Record<string, unknown>;

/**
 * Error details for notification operations
 */
export interface NotificationError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Attachment for notifications (email, push, etc.)
 */
export interface Attachment {
  filename: string;
  content?: Buffer | string;
  path?: string;
  contentType?: string;
  url?: string;
}
