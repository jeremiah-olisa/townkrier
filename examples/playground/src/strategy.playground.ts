import 'dotenv/config';
import {
  NotificationManager,
  NotificationChannel,
  NotificationRecipient,
  Logger,
  Notification,
  EmailContent,
  SmsContent,
  NotificationChannelConfig,
} from '@townkrier/core';

// 1. Define Notification
class StrategyTestNotification extends Notification {
  via(): NotificationChannel[] {
    return [NotificationChannel.EMAIL, NotificationChannel.SMS];
  }

  toEmail(): EmailContent {
    return {
      subject: 'Test Strategy',
      text: 'This is an email.',
      from: { email: 'test@example.com' },
    };
  }

  toSms(): SmsContent {
    return {
      text: 'This is an SMS.',
    };
  }
}

// 2. Mock Channel Factories
const createSuccessChannel = (name: string, type: string) => ({
  send: async () => {
    Logger.log(`[${name}] Sending... SUCCESS`);
    return { status: 'sent', id: `${type}-123` };
  },
  getChannelName: () => name,
  getChannelType: () => type,
  isReady: () => true,
});

const createFailChannel = (name: string, type: string) => ({
  send: async () => {
    Logger.log(`[${name}] Sending... FAIL`);
    throw new Error(`${name} failed intentionally`);
  },
  getChannelName: () => name,
  getChannelType: () => type,
  isReady: () => true,
});

async function run() {
  Logger.log('=== Strategy Playground ===');

  const notification = new StrategyTestNotification();
  const recipient: NotificationRecipient = {
    [NotificationChannel.EMAIL]: { email: 'user@example.com' },
    [NotificationChannel.SMS]: { phone: '1234567890' },
  };

  // Scenario 1: All-or-Nothing (Default)
  // Email succeeds, SMS fails -> Should throw error
  Logger.log('\n--- Scenario 1: All-or-Nothing (SMS Fails) ---');
  const manager1 = new NotificationManager({ channels: [], strategy: 'all-or-nothing' } as any); // default
  manager1.registerChannel(NotificationChannel.EMAIL, createSuccessChannel('MockEmail', 'email'));
  manager1.registerChannel(NotificationChannel.SMS, createFailChannel('MockSMS', 'sms'));

  try {
    await manager1.send(notification, recipient);
    Logger.error('❌ Failed: Should have thrown error!');
  } catch (e) {
    Logger.log('✅ Passed: Caught expected error:', (e as any).message);
  }

  // Scenario 2: Best-Effort
  // Email succeeds, SMS fails -> Should return report with partial status
  Logger.log('\n--- Scenario 2: Best-Effort (SMS Fails) ---');
  const manager2 = new NotificationManager({ channels: [], strategy: 'best-effort' } as any);
  manager2.registerChannel(NotificationChannel.EMAIL, createSuccessChannel('MockEmail', 'email'));
  manager2.registerChannel(NotificationChannel.SMS, createFailChannel('MockSMS', 'sms'));

  try {
    // We override via types to simulate strategy result
    const report = await manager2.send(notification, recipient);
    const r = report as any;

    Logger.log('Report Status:', r.status);
    Logger.log('Results:', r.results);
    Logger.log('Errors:', r.errors);

    if (r.status === 'partial' && r.results.get('email') && r.errors.get('sms')) {
      Logger.log('✅ Passed: Got expected partial result.');
    } else {
      Logger.error('❌ Failed: Unexpected report structure.');
    }
  } catch (e) {
    Logger.error('❌ Failed: Should NOT have thrown error!', e);
  }
}

run();
