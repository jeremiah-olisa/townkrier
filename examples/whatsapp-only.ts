import { TownkrierFactory, Logger, FallbackStrategy, NotificationSent, NotificationFailed } from 'townkrier-core';
import { WaSendApiDriver } from 'townkrier-wasender';
import { WhapiDriver } from 'townkrier-whapi';
import { WhatsappOnlyNotification } from './notifications/whatsapp-only.notification';
import { user } from './constants/user';

async function run() {
    try {
        // Initialize Townkrier with WhatsApp channel using Fallback Strategy
        const townkrier = TownkrierFactory.create<'whatsapp'>({
            channels: {
                whatsapp: {
                    strategy: FallbackStrategy.PriorityFallback,
                    drivers: [
                        {
                            use: WaSendApiDriver,
                            config: {
                                apiKey: process.env.WASENDER_API_KEY || '',
                                device: process.env.WASENDER_DEVICE || 'default', // device is required
                                baseUrl: process.env.WASENDER_API_URL || 'https://api.wasender.com',
                            },
                            priority: 10,
                            enabled: true,
                        },
                        {
                            use: WhapiDriver,
                            config: {
                                apiKey: process.env.WHAPI_TOKEN || '',
                                baseUrl: process.env.WHAPI_API_URL || 'https://gate.whapi.cloud',
                            },
                            priority: 5,
                            enabled: false,
                        },
                    ],
                },
            },
        });

        // Create notification
        const notification = new WhatsappOnlyNotification(user.name || 'Jeremiah', 'ORD-98765');

        Logger.info('💬 Sending WhatsApp Notification...');

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

            // Check if it's a composite failure with details
            const error = failedEvent.error as any;
            if (error && error.details) {
                console.log('\n--- Driver Failures ---');
                error.details.failures.forEach((f: any) => {
                    console.log(`[${f.driver}] ${f.error.message}`);
                });
                console.log('-----------------------\n');
            } else {
                console.error(failedEvent.error);
            }
        });

        // Send
        const result = await townkrier.send(user, notification);

        console.log('\n📊 Result:', result.status);

    } catch (error) {
        Logger.error('Fatal Error:', error);
    }
}

run();
