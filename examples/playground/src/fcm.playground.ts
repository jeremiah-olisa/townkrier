import {
  TownkrierFactory,
  Logger,
  Notification,
  PushContent,
  NotificationResult,
  NotificationPriority,
} from '@townkrier/core';
import { createFcmChannel } from '@townkrier/fcm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

class FcmTestNotification extends Notification {
  constructor(
    private readonly title: string,
    private readonly body: string,
    private readonly imageUrl?: string,
    private readonly data?: Record<string, string>,
  ) {
    super();
    this.priority = NotificationPriority.HIGH;
    this.metadata = {
      channelId: 'default',
    };
  }

  via(): string[] {
    return ['FCM'];
  }

  toPush(): PushContent {
    return {
      title: this.title,
      body: this.body,
      imageUrl: this.imageUrl,
      data: this.data,
    };
  }
}

async function run() {
  Logger.log('Starting FCM Playground...');

  // Credentials from .env
  const projectId = process.env.FCM_PROJECT_ID;
  // Service Account details
  const clientEmail = process.env.FCM_CLIENT_EMAIL;
  const privateKey = process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, '\n');

  // Target device
  const deviceToken = process.env.FCM_DEVICE_TOKEN;

  if (!projectId || !clientEmail || !privateKey) {
    Logger.error(
      '❌ Missing Backend Credentials in .env:\n' +
        'Please ensure the following are set in examples/playground/.env:\n' +
        '- FCM_PROJECT_ID\n' +
        '- FCM_CLIENT_EMAIL\n' +
        '- FCM_PRIVATE_KEY\n\n' +
        'Get these from Firebase Console -> Project Settings -> Service Accounts -> Generate New Private Key (JSON)',
    );
    return;
  }

  if (!deviceToken) {
    Logger.error(
      '❌ Missing Target Device Token in .env:\n' +
        'Please set FCM_DEVICE_TOKEN in examples/playground/.env\n' +
        'Get this token from the "Push Token" section in the running Expo app.',
    );
    return;
  }

  Logger.log(`Targeting device: ${deviceToken.substring(0, 15)}...`);

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
    const notification = new FcmTestNotification(
      'Townkrier FCM Test',
      'This is a test notification from Townkrier FCM channel with class!',
      'https://picsum.photos/200/300',
      {
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        screen: 'notifications',
        custom_key: 'custom_value',
      },
    );

    const result: NotificationResult = await factory.send(notification, { deviceToken });

    Logger.log('Notification sent:', result);

    if (result.status === 'success') {
      Logger.log('✅ Push notification sent successfully!');
    } else {
      const errorMessages = Array.from(result.errors.entries())
        .map(([channel, err]) => `${channel}: ${err.message}`)
        .join('; ');
      Logger.error(`❌ Failed to send push notification: ${errorMessages}`);
    }
  } catch (error) {
    Logger.error('❌ Error executing playground:', error);
  }
}

run().catch(console.error);
