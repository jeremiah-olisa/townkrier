import { NotificationFactory, NotificationStatus, Logger, SendEmailRequest } from '@townkrier/core';
import { createResendChannel } from '@townkrier/resend';
import { createSmtpChannel } from '@townkrier/smtp';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Validates that at least one of the conditions is true
 */
function hasAnyCredentials(...credentials: (string | undefined)[]): boolean {
  return credentials.some((c) => !!c);
}

async function run() {
  Logger.log('Starting Fallback Playground...');

  const from = process.env.FROM_EMAIL;
  if (!from) {
    console.error('FROM_EMAIL is required');
    return;
  }

  // Define channels logic
  // Scenario: Try Resend first. If fails (e.g. bad key), fallback to SMTP.

  // 1. Setup Resend (Primary) - Intentionally using bad key to force fallback if desired for test, or use real key
  const resendKey = process.env.RESEND_API_KEY || 're_INVALID_KEY';
  const resendChannel = createResendChannel({ apiKey: resendKey, from, failSilently: false }); // Ensure it throws on config error or we handle response

  // 2. Setup SMTP (Fallback) - Using Mailtrap SMTP credentials usually
  const smtpConfig = {
    host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '2525', 10),
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
    from,
  };

  const smtpChannel = createSmtpChannel(smtpConfig);

  const factory = new NotificationFactory();
  factory.addChannel(resendChannel);
  factory.addChannel(smtpChannel);

  Logger.log('Attempting to send email with fallback logic...');

  const request: SendEmailRequest = {
    to: [{ email: 'test-recipient@example.com' }],
    from: { email: from },
    subject: 'Townkrier Fallback Test',
    html: '<p>This message was delivered via one of the available channels.</p>',
    message: 'Fallback Test', // Required by BaseNotificationRequest
  };

  // Custom fallback logic implementation
  // Currently, factory.send() targets a SPECIFIC channel name.
  // To implement fallback, we wrap the logic manually or use a future "CompositeChannel" feature.
  // Here is a manual fallback implementation:

  const channelsToTry = ['Resend', 'SMTP'];
  let sent = false;

  for (const channelName of channelsToTry) {
    Logger.log(`Trying channel: ${channelName}...`);
    try {
      const result = await factory.send(channelName, request);

      if (result.status === NotificationStatus.SENT) {
        Logger.log(`✅ Successfully sent via ${channelName}!`);
        sent = true;
        break;
      } else {
        Logger.warn(`⚠️ Failed to send via ${channelName}. Status: ${result.status}`, result.error);
      }
    } catch (error) {
      Logger.warn(`⚠️ Exception sending via ${channelName}:`, error);
    }
  }

  if (!sent) {
    Logger.error('❌ Failed to send email via ALL channels.');
  }
}

run().catch(console.error);
