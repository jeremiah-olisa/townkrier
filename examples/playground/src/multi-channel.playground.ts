import 'dotenv/config';
import {
  NotificationManager,
  NotificationChannel,
  NotificationRecipient,
  Logger,
  SendEmailResponse,
  SendSmsResponse,
  SendPushResponse,
} from '@townkrier/core';
import { createResendChannel } from '@townkrier/resend';
import { createFcmChannel } from '@townkrier/fcm';
import { createTermiiChannel } from '@townkrier/termii';
import { WelcomeNotification } from './welcome-notification';

// Mock Config from .env
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_123';
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';

const FCM_PROJECT_ID = process.env.FCM_PROJECT_ID || 'test-project';
const FCM_CLIENT_EMAIL = process.env.FCM_CLIENT_EMAIL || 'test@example.com';
const FCM_PRIVATE_KEY = process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, '\n') || 'private-key';

const TERMII_API_KEY = process.env.TERMII_API_KEY || 'termii-key';
const TERMII_SENDER_ID = process.env.TERMII_SENDER_ID || 'Townkrier';

async function run() {
  Logger.log('--- Multi-Channel Notification Playground ---');

  // 1. Setup Manager
  const manager = new NotificationManager({
    channels: [],
    enableFallback: true,
  });

  // 2. Configure Channels
  Logger.log('Configuring channels...');

  // Email (Resend)
  const resendChannel = createResendChannel({
    apiKey: RESEND_API_KEY,
    from: FROM_EMAIL,
  });

  // Push (FCM)
  const fcmChannel = createFcmChannel({
    projectId: FCM_PROJECT_ID,
    serviceAccount: {
      projectId: FCM_PROJECT_ID,
      clientEmail: FCM_CLIENT_EMAIL,
      privateKey: FCM_PRIVATE_KEY,
    },
  });

  // SMS (Termii)
  const termiiChannel = createTermiiChannel({
    apiKey: TERMII_API_KEY,
    from: TERMII_SENDER_ID,
  });

  // 3. Register Channels
  manager.registerChannel(NotificationChannel.EMAIL, resendChannel);
  manager.registerChannel(NotificationChannel.PUSH, fcmChannel);
  manager.registerChannel(NotificationChannel.SMS, termiiChannel);

  Logger.log('Channels registered: Email, Push, SMS');

  // 4. Usage Example
  const userName = 'Jeremiah';
  const notification = new WelcomeNotification(userName);

  // Define Recipient Routing
  // In a real app, this would likely come from your User entity
  const recipient: NotificationRecipient = {
    // Email routing
    [NotificationChannel.EMAIL]: {
      email: 'jeremiaholisa453@gmail.com',
      name: userName,
    },
    // SMS routing
    [NotificationChannel.SMS]: {
      phone: '2348012345678', // Replace with valid number for testing
    },
    // Push routing
    [NotificationChannel.PUSH]: {
      deviceToken: 'device-token-123', // Replace with valid FCM token for testing
    },
  };

  Logger.log(
    `Sending WelcomeNotification to ${userName} via [${notification.via().join(', ')}]...`,
  );

  try {
    const results = await manager.send(notification, recipient);

    Logger.log('--- Send Results ---');
    results.forEach((r, channel) => {
      const response = r as SendEmailResponse | SendSmsResponse | SendPushResponse;
      Logger.log(
        `[${channel.toUpperCase()}] Status: ${response.status} | ID: ${response.messageId || 'N/A'}`,
      );
      if (response.error) {
        Logger.error(`  Error: ${response.error.message}`);
      }
    });
  } catch (error) {
    Logger.error('Failed to send notification:', error);
  }
}

run().catch((error) => Logger.error('Unhandled error:', error));
