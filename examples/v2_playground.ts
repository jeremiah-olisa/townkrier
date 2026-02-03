import {
  TownkrierFactory,
  Notification,
  Notifiable,
  DeliveryStrategy,
  FallbackStrategy,
} from 'townkrier-core';
import { ResendDriver, ResendMessage } from 'townkrier-resend';
import { MailtrapDriver, MailtrapMessage } from 'townkrier-mailtrap';

// 1. Setup Configuration with Multiple Strategies
const notificationManager = TownkrierFactory.create<'email' | 'sms' | 'push'>({
  strategy: DeliveryStrategy.BestEffort,
  channels: {
    // Priority Fallback: Try Resend first, fallback to Mailtrap
    email: {
      strategy: FallbackStrategy.PriorityFallback,
      drivers: [
        {
          use: ResendDriver,
          config: { apiKey: process.env.RESEND_API_KEY || 're_123' },
          priority: 10, // Higher priority
        },
        {
          use: MailtrapDriver,
          config: { token: process.env.MAILTRAP_TOKEN || 'mt_123' },
          priority: 5, // Lower priority (fallback)
        },
      ],
    },
    // Round-robin: Distribute load across multiple providers
    sms: {
      strategy: 'round-robin',
      drivers: [
        {
          use: ResendDriver, // Simulating SMS driver 1
          config: { apiKey: 'sms_provider_1' },
        },
        {
          use: MailtrapDriver, // Simulating SMS driver 2
          config: { token: 'sms_provider_2' },
        },
      ],
    },
    // Random (weighted): 70% Resend, 30% Mailtrap
    push: {
      strategy: FallbackStrategy.Random,
      drivers: [
        {
          use: ResendDriver,
          config: { apiKey: 'push_provider_1' },
          weight: 7,
        },
        {
          use: MailtrapDriver,
          config: { token: 'push_provider_2' },
          weight: 3,
        },
      ],
    },
  },
});

// 2. Define a Notification
class WelcomeNotification extends Notification<'email'> {
  constructor(private userName: string) {
    super();
  }

  via(notifiable: Notifiable): 'email'[] {
    return ['email'];
  }

  toEmail(notifiable: Notifiable): ResendMessage | MailtrapMessage {
    return {
      subject: `Welcome ${this.userName}!`,
      html: `<p>Welcome to Townkrier V2 with Production-Grade Strategies</p>`,
      to: notifiable.routeNotificationFor('email') as string,
    };
  }
}

// 3. Define a Notifiable Entity
const user: Notifiable = {
  id: 'user_1',
  email: 'jeremiah@example.com',
  routeNotificationFor<T = string>(driver: string): T | undefined {
    if (driver === 'email') return this.email as T;
    return undefined;
  },
};

// 4. Send Notification with Event Listeners
async function run() {
  console.log('🚀 Sending notification with production strategies...\n');

  // Register event logging
  notificationManager.events().on('NotificationSending', (event) => {
    console.log(`📤 [EVENT] Sending notification via: ${event.channels.join(', ')}`);
  });

  notificationManager.events().on('NotificationSent', (event) => {
    console.log(`✅ [EVENT] Notification Sent! Results:`, event.responses);
  });

  notificationManager.events().on('NotificationFailed', (event) => {
    console.error(`❌ [EVENT] Notification Failed:`, event.error.message);
  });

  try {
    const results = await notificationManager.send(user, new WelcomeNotification('Jeremiah'));
    console.log('\n📊 Final Results:', {
      status: results.status,
      successCount: results.results.size,
      errorCount: results.errors.size,
    });
  } catch (error) {
    console.error('💥 Fatal error:', error);
  }
}

run().catch(console.error);
