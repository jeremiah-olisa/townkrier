import { Notification, NotificationChannel, NotificationPriority } from '@townkrier/core';

/**
 * PaymentSuccessfulNotification
 *
 * This notification is sent when [describe the event/scenario].
 *
 * Channels: EMAIL, SMS, IN_APP
 */
export class PaymentSuccessfulNotification extends Notification {
  /**
   * Create a new notification instance
   */
  constructor() {
    super();
    // Set notification priority (URGENT, HIGH, NORMAL, LOW)
    this.priority = NotificationPriority.NORMAL;
  }

  /**
   * Get the notification's delivery channels
   */
  via(): NotificationChannel[] {
    return [NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.IN_APP];
  }

  /**
   * Get the email representation of the notification
   */
  toEmail() {
    return {
      subject: 'Your notification subject',
      html: '<h1>Your notification content</h1>',
      text: 'Your notification content',
      // from: { email: 'custom@example.com', name: 'Custom Name' },
      // replyTo: { email: 'reply@example.com', name: 'Reply Name' },
    };
  }

  /**
   * Get the SMS representation of the notification
   */
  toSms() {
    return {
      text: 'Your SMS message text',
      // from: 'YourApp',
    };
  }

  /**
   * Get the in-app notification representation
   */
  toInApp() {
    return {
      title: 'Your notification title',
      message: 'Your notification message',
      // type: 'info',
      // actionUrl: '/some/path',
      // icon: 'info-icon',
      // data: { key: 'value' },
    };
  }
}
