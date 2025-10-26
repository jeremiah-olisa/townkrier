/**
 * Example demonstrating the notify() helper function
 *
 * This shows how to use the notify() helper to send notifications
 * to entities that implement the Notifiable interface.
 */

import {
  NotificationManager,
  Notification,
  NotificationChannel,
  NotificationPriority,
  Notifiable,
  notify, // The helper function
} from '@townkrier/core';

import { createResendChannel } from '@townkrier/resend';

// ============================================================================
// 1. Create a User class that implements Notifiable
// ============================================================================

class User implements Notifiable {
  constructor(
    public id: string,
    public name: string,
    public email: string,
    public phone?: string,
  ) {}

  /**
   * Route notifications for different channels
   */
  routeNotificationFor(channel: NotificationChannel): string | undefined {
    switch (channel) {
      case NotificationChannel.EMAIL:
        return this.email;
      case NotificationChannel.SMS:
        return this.phone;
      case NotificationChannel.PUSH:
        // Could return device token here
        return undefined;
      default:
        return this.email;
    }
  }

  /**
   * Get the name for notifications (optional)
   */
  getNotificationName(): string {
    return this.name;
  }
}

// ============================================================================
// 2. Create a custom notification
// ============================================================================

class AccountVerificationNotification extends Notification {
  constructor(
    private userName: string,
    private verificationCode: string,
  ) {
    super();
    this.priority = NotificationPriority.HIGH;
  }

  /**
   * Specify which channels to use
   */
  via(): NotificationChannel[] {
    return [NotificationChannel.EMAIL];
  }

  /**
   * Build email content
   */
  toEmail() {
    return {
      subject: 'Verify Your Account',
      html: `
        <h1>Hello ${this.userName}!</h1>
        <p>Your verification code is: <strong>${this.verificationCode}</strong></p>
        <p>This code expires in 10 minutes.</p>
      `,
      text: `Hello ${this.userName}! Your verification code is: ${this.verificationCode}. This code expires in 10 minutes.`,
    };
  }
}

// ============================================================================
// 3. Setup and use the notify() helper
// ============================================================================

async function main() {
  // Setup NotificationManager
  const manager = new NotificationManager({
    defaultChannel: 'email-resend',
    channels: [
      {
        name: 'email-resend',
        enabled: true,
        config: {
          apiKey: process.env.RESEND_API_KEY || 'test-key',
          from: 'noreply@example.com',
          fromName: 'My App',
        },
      },
    ],
  });

  manager.registerFactory('email-resend', createResendChannel);

  // Create a user (Notifiable entity)
  const user = new User('123', 'John Doe', 'john@example.com', '+1234567890');

  // Create a notification
  const notification = new AccountVerificationNotification(user.name, '123456');

  // Use the notify() helper - it automatically converts the Notifiable to NotificationRecipient
  try {
    console.log('📤 Sending notification to user...');
    const results = await notify(user, notification, manager);

    console.log('✅ Notification sent successfully!');
    console.log('Channels used:', Array.from(results.keys()));
    console.log('Results:', results);
  } catch (error) {
    console.error('❌ Failed to send notification:', error);
  }
}

// ============================================================================
// Alternative: Multiple notifications to the same user
// ============================================================================

async function sendMultipleNotifications() {
  const manager = new NotificationManager({
    defaultChannel: 'email-resend',
    channels: [
      {
        name: 'email-resend',
        enabled: true,
        config: {
          apiKey: process.env.RESEND_API_KEY || 'test-key',
          from: 'noreply@example.com',
          fromName: 'My App',
        },
      },
    ],
  });

  manager.registerFactory('email-resend', createResendChannel);

  const user = new User('123', 'Jane Doe', 'jane@example.com');

  // Send multiple notifications using the notify helper
  const notifications = [
    new AccountVerificationNotification(user.name, '123456'),
    // You can add more notification types here
  ];

  console.log(`📤 Sending ${notifications.length} notifications...`);

  for (const notification of notifications) {
    try {
      await notify(user, notification, manager);
      console.log('✅ Notification sent');
    } catch (error) {
      console.error('❌ Failed:', error);
    }
  }
}

// ============================================================================
// Run examples
// ============================================================================

if (require.main === module) {
  console.log('='.repeat(80));
  console.log('notify() Helper Function Example');
  console.log('='.repeat(80));

  main()
    .then(() => {
      console.log('\n' + '='.repeat(80));
      console.log('Multiple Notifications Example');
      console.log('='.repeat(80));
      return sendMultipleNotifications();
    })
    .then(() => {
      console.log('\n✨ Examples completed!');
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}
