import { NotificationFactory, NotificationStatus, Logger } from '@townkrier/core';
import { createMailtrapChannel } from '@townkrier/mailtrap';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
  Logger.log('Starting Mailtrap Playground...');

  const token = process.env.MAILTRAP_API_TOKEN;
  const from = process.env.FROM_EMAIL;

  if (!token || !from) {
    Logger.error('Missing MAILTRAP_API_TOKEN or FROM_EMAIL in .env');
    return;
  }

  // Create channel manually or via factory if registered (factory registration usually implicitly handled if direct import)
  // Here we use the factory function directly
  const mailtrapChannel = createMailtrapChannel({
    token,
    from,
    fromName: 'Townkrier Mailtrap Demo',
  });

  const factory = new NotificationFactory();
  factory.addChannel(mailtrapChannel);

  try {
    const result = await factory.send('Mailtrap', {
      to: { email: 'test-recipient@example.com' }, // Replace with real email for actual test if needed, or use Mailtrap inbox
      subject: 'Hello from Townkrier + Mailtrap',
      html: '<h1>It works!</h1><p>This is a test email sent via Mailtrap.</p>',
      from: { email: from, name: 'Townkrier Playground' },
      message: 'Mailtrap Test',
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
