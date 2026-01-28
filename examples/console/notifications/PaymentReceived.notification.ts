import { Notification, NotificationChannel, NotificationPriority } from 'townkrier-core';

/**
 * PaymentReceivedNotification
 *
 * This notification is sent when [describe the event/scenario].
 *
 * Channels: EMAIL, SMS, PUSH
 */
export class PaymentReceivedNotification extends Notification {
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
    return [NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.PUSH];
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
   * Get the push notification representation
   */
  toPush() {
    return {
      title: 'Your notification title',
      body: 'Your notification body',
      // imageUrl: 'https://example.com/image.png',
      // actionUrl: 'https://example.com/action',
      // icon: 'notification-icon.png',
      // sound: 'default',
      // badge: 1,
      // data: { key: 'value' },
    };
  }
}
