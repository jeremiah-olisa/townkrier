import 'dotenv/config';
import {
  NotificationManager,
  Notification,
  NotificationChannel,
  NotificationChannelType,
  NotificationRecipient,
} from '@townkrier/core';
import { createResendChannel } from '@townkrier/resend';

// Mock Config
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_123456789';
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';

// Define a Notification
class WelcomeNotification extends Notification {
  constructor(private userName: string) {
    super();
  }

  via(): NotificationChannelType[] {
    return [NotificationChannel.EMAIL];
  }

  toEmail() {
    return {
      subject: 'Welcome to Townkrier',
      html: `<p>Hello ${this.userName}, welcome to our platform!</p>`,
      text: `Hello ${this.userName}, welcome to our platform!`,
    };
  }
}

async function run() {
  console.log('--- Resend Playground ---');

  // 1. Setup Manager
  const manager = new NotificationManager({
    channels: [],
    enableFallback: true,
  });

  // 2. Register Resend Channel
  const resendChannel = createResendChannel({
    apiKey: RESEND_API_KEY,
    from: FROM_EMAIL,
  });

  // Using generic string key for channel since core is now generic
  manager.registerChannel(NotificationChannel.EMAIL, resendChannel);

  // 3. Send Notification
  const recipient = { email: 'delivered@resend.dev', name: 'Test User' };

  // Create a Notifiable-like object or use manual sending
  // Since we don't have a full User entity here, we'll manually construct the notification
  // OR we can pretend we have a user.

  console.log(`Sending notification to ${recipient.email}...`);

  const notification = new WelcomeNotification(recipient.name);

  try {
    // We can use manager.send directly if we construct the recipient routing map manually
    // Or we use the 'notify' helper if we have a Notifiable.
    // Let's use manager.send directly for simplicity in playground,
    // simulating what 'notify' does.

    // The manager.send signature is: send(notification, recipient)
    // where recipient is NotificationRecipient (which is a map of channel -> routing info)

    const routing: NotificationRecipient = {
      [NotificationChannel.EMAIL]: recipient,
    };

    const results = await manager.send(notification, routing);

    console.log('Results:', results);

    const emailResult = results.get(NotificationChannel.EMAIL);
    console.log('Email Result:', JSON.stringify(emailResult, null, 2));
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

run().catch(console.error);
