import { Notification, NotificationChannel, NotificationChannelType } from '@townkrier/core';

/**
 * Example Welcome Notification
 * Demonstrates support for multiple channels (Email, SMS, Push)
 */
export class WelcomeNotification extends Notification {
  constructor(private userName: string) {
    super();
  }

  /**
   * Defines which channels to send this notification to
   */
  via(): NotificationChannelType[] {
    return [NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.PUSH];
  }

  /**
   * Format for Email channel
   */
  toEmail() {
    return {
      subject: 'Welcome to Townkrier!',
      html: `
        <h1>Welcome, ${this.userName}!</h1>
        <p>We are excited to have you on board.</p>
        <p>Get started by exploring our documentation.</p>
      `,
      text: `Welcome, ${this.userName}! We are excited to have you on board.`,
    };
  }

  /**
   * Format for SMS channel
   */
  toSms() {
    return {
      text: `Hi ${this.userName}, welcome to Townkrier! 🚀`,
    };
  }

  /**
   * Format for Push channel
   */
  toPush() {
    return {
      title: 'Welcome Aboard!',
      body: `Hi ${this.userName}, thanks for joining Townkrier.`,
      icon: 'https://townkrier.dev/logo.png',
      data: {
        type: 'welcome',
        userId: 'user_123',
      },
    };
  }
}
