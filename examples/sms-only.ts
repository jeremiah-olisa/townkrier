import { TownkrierFactory, Logger, NotificationSent, NotificationFailed } from 'townkrier-core';
import { TermiiDriver, TermiiConfig } from 'townkrier-termii';
import { SmsOnlyNotification } from './notifications/sms-only.notification';
import { user } from './constants/user';

async function run() {
    try {
        // Initialize Townkrier with SMS channel
        const townkrier = TownkrierFactory.create<'sms'>({
            channels: {
                sms: {
                    driver: TermiiDriver,
                    config: {
                        apiKey: process.env.TERMII_API_KEY || '',
                        from: process.env.TERMII_SENDER_ID || '',
                    } as TermiiConfig,
                },
            },
        });

        // Create notification
        const notification = new SmsOnlyNotification(user.name || 'Jeremiah', '123456');

        Logger.info('📱 Sending SMS Notification...');

        // Listen for events
        townkrier.events().on('notification.sending', (event) => {
            console.log(`📤 [EVENT] Sending via: ${event.channels.join(', ')}`);
        });

        townkrier.events().on('notification.sent', (event) => {
            const sentEvent = event as NotificationSent;
            console.log('✅ [EVENT] Notification Sent!');
            console.log(JSON.stringify(Object.fromEntries(sentEvent.responses), null, 2));
        });

        townkrier.events().on('notification.failed', (event) => {
            const failedEvent = event as NotificationFailed;
            console.log('❌ [EVENT] Notification Failed');
            console.error(failedEvent.error);
        });

        // Send
        const result = await townkrier.send(user, notification);

        console.log('\n📊 Result:', result.status);

    } catch (error) {
        Logger.error('Fatal Error:', error);
    }
}

run();
