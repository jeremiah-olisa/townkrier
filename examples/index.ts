import { notificationManager } from './config';
import { user } from './constants/user';
import { WelcomeNotification } from './notifications/welcome.notification';

// 2. Run the Notification Logic
async function run() {
  console.log('🚀 Sending notification with production strategies...\n');

  // Register event logging
  notificationManager.events().on('NotificationSending', (event: any) => {
    console.log(`📤 [EVENT] Sending notification via: ${event.channels.join(', ')}`);
  });

  notificationManager.events().on('NotificationSent', (event: any) => {
    console.log(`✅ [EVENT] Notification Sent!`);
    const responseObj = event.responses instanceof Map
      ? Object.fromEntries(event.responses)
      : event.responses;
    console.log(JSON.stringify(responseObj, null, 2));
  });

  notificationManager.events().on('NotificationFailed', (event: any) => {
    console.error(`❌ [EVENT] Notification Failed:`, event.error.message);
  });

  try {
    console.log(`Sending WelcomeNotification to ${user.name}...`);
    const results = await notificationManager.send(user, new WelcomeNotification(user.name || 'Jeremiah'));

    console.log('\n📊 Final Results Summary:', {
      status: results.status,
      successCount: results.results.size,
      errorCount: results.errors.size,
    });

    if (results.errors.size > 0) {
      console.log('\nErrors encountered:');
      results.errors.forEach((error: Error, key: string) => {
        console.log(`- ${key}: ${typeof error === 'object' ? JSON.stringify(error) : error}`);
      });
    }

  } catch (error) {
    console.error('💥 Fatal error:', error);
  }
}

// Execute
run().catch(console.error);
