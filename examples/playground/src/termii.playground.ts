import { TownkrierFactory, NotificationStatus, Logger } from '@townkrier/core';
import { createTermiiChannel } from '@townkrier/termii';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
  Logger.log('Starting Termii Playground...');

  const apiKey = process.env.TERMII_API_KEY;
  const senderId = process.env.TERMII_SENDER_ID || 'Townkrier';
  const to = process.env.TERMII_TEST_PHONE; // Target phone number

  if (!apiKey || !to) {
    Logger.error('Missing TERMII_API_KEY or TERMII_TEST_PHONE in .env');
    return;
  }

  // Create Channel
  const termiiChannel = createTermiiChannel({
    apiKey,
    from: senderId,
  });

  const factory = TownkrierFactory.create({
    channels: [termiiChannel],
  });

  try {
    const result = await factory.sendWithAdapterFallback('Termii', {
      to: { phone: to },
      message: 'Hello from Townkrier! This is a test SMS via Termii.',
    });

    Logger.log('Notification sent:', result);

    if (result.status === NotificationStatus.SENT) {
      Logger.log('✅ SMS sent successfully!');
    } else {
      Logger.error('❌ Failed to send SMS:', result.error);
    }
  } catch (error) {
    Logger.error('❌ Error executing playground:', error);
  }
}

run().catch(console.error);
