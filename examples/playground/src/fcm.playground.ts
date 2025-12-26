import { TownkrierFactory, NotificationStatus, Logger } from '@townkrier/core';
import { createFcmChannel } from '@townkrier/fcm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
  Logger.log('Starting FCM Playground...');

  const projectId = process.env.FCM_PROJECT_ID;
  const clientEmail = process.env.FCM_CLIENT_EMAIL;
  const privateKey = process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, '\n'); // Handle newlines in env var

  const deviceToken = process.env.FCM_DEVICE_TOKEN; // Target device

  if (!projectId || !clientEmail || !privateKey || !deviceToken) {
    Logger.error(
      'Missing FCM credentials (FCM_PROJECT_ID, FCM_CLIENT_EMAIL, FCM_PRIVATE_KEY) or FCM_DEVICE_TOKEN in .env',
    );
    return;
  }

  // Create Channel
  const fcmChannel = createFcmChannel({
    projectId,
    serviceAccount: {
      projectId,
      clientEmail,
      privateKey,
    },
  });

  const factory = TownkrierFactory.create({
    channels: [fcmChannel],
  });

  try {
    const result = await factory.sendWithAdapterFallback('FCM', {
      to: { deviceToken },
      title: 'Townkrier FCM Test',
      body: 'This is a test notification from Townkrier FCM channel!',
      data: {
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        screen: 'notifications',
      },
    });

    Logger.log('Notification sent:', result);

    if (result.status === NotificationStatus.SENT) {
      Logger.log('✅ Push notification sent successfully!');
    } else {
      Logger.error('❌ Failed to send push notification:', result.error);
    }
  } catch (error) {
    Logger.error('❌ Error executing playground:', error);
  }
}

run().catch(console.error);
