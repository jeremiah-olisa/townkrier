import { NotificationStatus, NotificationError, NotificationMetadata } from '../types';

/**
 * Base response for notification operations
 */
export interface NotificationResponse {
  /**
   * Whether the operation was successful
   */
  success: boolean;

  /**
   * Error information if operation failed
   */
  error?: NotificationError;

  /**
   * Provider-specific response data
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw?: any;
}

/**
 * Response from sending an email
 */
export interface SendEmailResponse extends NotificationResponse {
  /**
   * Unique message ID
   */
  messageId: string;

  /**
   * Reference for this notification
   */
  reference?: string;

  /**
   * Status of the notification
   */
  status: NotificationStatus;

  /**
   * Timestamp when sent
   */
  sentAt?: Date;

  /**
   * Additional metadata
   */
  metadata?: NotificationMetadata;
}

/**
 * Response from sending SMS
 */
export interface SendSmsResponse extends NotificationResponse {
  /**
   * Unique message ID
   */
  messageId: string;

  /**
   * Reference for this notification
   */
  reference?: string;

  /**
   * Status of the notification
   */
  status: NotificationStatus;

  /**
   * Timestamp when sent
   */
  sentAt?: Date;

  /**
   * Number of SMS units used (for billing)
   */
  units?: number;

  /**
   * Additional metadata
   */
  metadata?: NotificationMetadata;
}

/**
 * Response from sending push notification
 */
export interface SendPushResponse extends NotificationResponse {
  /**
   * Unique message ID
   */
  messageId: string;

  /**
   * Reference for this notification
   */
  reference?: string;

  /**
   * Status of the notification
   */
  status: NotificationStatus;

  /**
   * Timestamp when sent
   */
  sentAt?: Date;

  /**
   * Number of successful deliveries
   */
  successCount?: number;

  /**
   * Number of failed deliveries
   */
  failureCount?: number;

  /**
   * Additional metadata
   */
  metadata?: NotificationMetadata;
}

/**
 * Response from sending in-app notification
 */
export interface SendInAppResponse extends NotificationResponse {
  /**
   * Unique notification ID
   */
  notificationId: string;

  /**
   * Reference for this notification
   */
  reference?: string;

  /**
   * Status of the notification
   */
  status: NotificationStatus;

  /**
   * Timestamp when created
   */
  createdAt?: Date;

  /**
   * Additional metadata
   */
  metadata?: NotificationMetadata;
}
