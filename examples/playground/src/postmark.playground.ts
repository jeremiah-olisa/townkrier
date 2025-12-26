import { TownkrierFactory, NotificationStatus, Logger } from '@townkrier/core';
import { createPostmarkChannel } from '@townkrier/postmark';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
  Logger.log('Starting Postmark Playground...');

  const serverToken = process.env.POSTMARK_SERVER_TOKEN;
  const from = process.env.FROM_EMAIL;

  if (!serverToken || !from) {
    Logger.error('Missing POSTMARK_SERVER_TOKEN or FROM_EMAIL in .env');
    return;
  }

  const postmarkChannel = createPostmarkChannel({
    serverToken,
    from,
    fromName: 'Townkrier Postmark Demo',
  });

  const factory = TownkrierFactory.create({
    channels: [postmarkChannel],
  });

  try {
    const result = await factory.sendWithAdapterFallback('Postmark', {
      to: { email: 'test-recipient@example.com' },
      from: { email: from, name: 'Townkrier Postmark Demo' },
      subject: 'Hello from Townkrier + Postmark',
      html: '<h1>It works!</h1><p>This is a test email sent via Postmark.</p>',
      text: 'This is a test email sent via Postmark.',
      message: 'Postmark Test',
    });

    Logger.log('Notification sent:', result);

    if (result.status === NotificationStatus.SENT) {
      Logger.log('✅ Email sent successfully!');
    } else {
      Logger.error('❌ Failed to send email:', result.error);
    }
  } catch (error) {
    Logger.error('❌ Error executing playground:', error);
  }
}

run().catch(console.error);
