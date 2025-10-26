import { NotificationChannel, NotificationPriority, NotificationMetadata } from '../types';

/**
 * Base Notification class
 * Represents a notification to be sent through various channels
 */
export abstract class Notification {
  /**
   * Notification priority
   */
  public priority: NotificationPriority = NotificationPriority.NORMAL;

  /**
   * Custom reference for this notification
   */
  public reference?: string;

  /**
   * Additional metadata
   */
  public metadata?: NotificationMetadata;

  /**
   * Get the channels this notification should be sent through
   * Override this method to specify which channels to use
   */
  abstract via(): NotificationChannel[];

  /**
   * Convert notification to email format
   * Override this method if the notification should support email
   */
  toEmail?(): {
    subject: string;
    text?: string;
    html?: string;
    from?: { email: string; name?: string };
    replyTo?: { email: string; name?: string };
  };

  /**
   * Convert notification to SMS format
   * Override this method if the notification should support SMS
   */
  toSms?(): {
    text: string;
    from?: string;
  };

  /**
   * Convert notification to push notification format
   * Override this method if the notification should support push
   */
  toPush?(): {
    title: string;
    body: string;
    imageUrl?: string;
    actionUrl?: string;
    icon?: string;
    sound?: string;
    badge?: number;
    data?: NotificationMetadata;
  };

  /**
   * Convert notification to in-app format
   * Override this method if the notification should support in-app
   */
  toInApp?(): {
    title: string;
    message: string;
    type?: string;
    actionUrl?: string;
    icon?: string;
    data?: NotificationMetadata;
  };

  /**
   * Set the priority of this notification
   */
  setPriority(priority: NotificationPriority): this {
    this.priority = priority;
    return this;
  }

  /**
   * Set a custom reference for this notification
   */
  setReference(reference: string): this {
    this.reference = reference;
    return this;
  }

  /**
   * Set metadata for this notification
   */
  setMetadata(metadata: NotificationMetadata): this {
    this.metadata = metadata;
    return this;
  }
}
