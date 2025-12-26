import { NotificationFactory, NotificationStatus, Logger } from '@townkrier/core';
import { createSmtpChannel } from '@townkrier/smtp';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
  Logger.log('Starting SMTP Playground...');

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.FROM_EMAIL;

  if (!host || !user || !pass || !from) {
    Logger.error('Missing SMTP_HOST, SMTP_USER, SMTP_PASS, or FROM_EMAIL in .env');
    return;
  }

  const smtpChannel = createSmtpChannel({
    host,
    port,
    auth: { user, pass },
    from,
    fromName: 'Townkrier SMTP Demo',
  });

  const factory = new NotificationFactory();
  factory.addChannel(smtpChannel);

  try {
    const result = await factory.send('SMTP', {
      to: { email: 'test-recipient@example.com' },
      from: { email: from, name: 'Townkrier SMTP Demo' },
      subject: 'Hello from Townkrier + SMTP',
      html: '<h1>It works!</h1><p>This is a test email sent via SMTP (likely Mailtrap sandbox).</p>',
      message: 'SMTP Test',
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
