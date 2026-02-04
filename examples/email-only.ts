import { TownkrierFactory, Logger, NotificationSent, NotificationFailed } from 'townkrier-core';
import { ResendDriver } from 'townkrier-resend';
import { MailtrapDriver } from 'townkrier-mailtrap';
import { SmtpDriver } from 'townkrier-smtp';
import { EmailOnlyNotification } from './notifications/email-only.notification';
import { FallbackStrategy, DeliveryStrategy } from 'townkrier-core';
import { user } from './constants/user';

// Setup Notification Manager for Email Only
const notificationManager = TownkrierFactory.create({
    strategy: DeliveryStrategy.BestEffort,
    channels: {
        email: {
            strategy: FallbackStrategy.PriorityFallback,
            drivers: [
                {
                    use: ResendDriver,
                    config: { apiKey: process.env.RESEND_API_KEY || '' },
                    priority: 10,
                    enabled: false,
                },
                {
                    use: MailtrapDriver,
                    config: {
                        token: process.env.MAILTRAP_TOKEN || '',
                        testInboxId: process.env.MAILTRAP_TEST_INBOX_ID
                            ? parseInt(process.env.MAILTRAP_TEST_INBOX_ID)
                            : undefined,
                        endpoint: process.env.MAILTRAP_ENDPOINT,
                    },
                    priority: 8,
                    enabled: true,
                },
                {
                    use: SmtpDriver,
                    config: {
                        host: process.env.SMTP_HOST || '',
                        port: parseInt(process.env.SMTP_PORT || '587'),
                        secure: process.env.SMTP_SECURE === 'true',
                        auth: {
                            user: process.env.SMTP_USER || '',
                            pass: process.env.SMTP_PASS || '',
                        },
                        from: 'Townkrier <townkrier@monievault.com>',
                    },
                    priority: 6,
                    enabled: false,
                },
            ],
        },
    },
});

async function run() {
    console.log('📧 Sending Email Notification...');

    // Register events
    notificationManager.events().on('NotificationSending', (event: any) => {
        console.log(`📤 [EVENT] Sending via: ${event.channels.join(', ')}`);
    });

    notificationManager.events().on('NotificationSent', (event: any) => {
        console.log(`✅ [EVENT] Notification Sent!`);
        const responseObj = event.responses instanceof Map
            ? Object.fromEntries(event.responses)
            : event.responses;
        console.log(JSON.stringify(responseObj, null, 2));
    });

    notificationManager.events().on('NotificationFailed', (event: any) => {
        console.error(`❌ [EVENT] Notification Failed`);

        const details = (event.error as any).details;
        if (details && details.failures && Array.isArray(details.failures)) {
            console.log('\n--- Driver Failures ---');
            details.failures.forEach((fail: any) => {
                console.log(`[${fail.driver}] ${fail.error}`);
            });
            console.log('-----------------------\n');
        } else {
            console.error(event.error.message);
        }
    });

    try {
        const result = await notificationManager.send(user, new EmailOnlyNotification(user.name || 'Jeremiah'));

        console.log('\n📊 Result:', result.status);
        //  if (result.errors.size > 0) {
        //      // The event listener already logged the detailed errors nicely
        //  }

    } catch (error) {
        console.error('Fatal:', error);
    }
}

run();
