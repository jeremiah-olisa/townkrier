
import { TownkrierFactory, DeliveryStrategy, FallbackStrategy } from 'townkrier-core';
import { ResendDriver } from 'townkrier-resend';
import { MailtrapDriver } from 'townkrier-mailtrap';
import { EmailOnlyNotification } from './notifications/email-only.notification';
import { User } from './models/user.model';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Setup Notification Manager for Email Only
const notificationManager = TownkrierFactory.create({
    strategy: DeliveryStrategy.BestEffort,
    channels: {
        email: {
            strategy: FallbackStrategy.PriorityFallback,
            drivers: [
                // {
                //     use: ResendDriver,
                //     config: { apiKey: process.env.RESEND_API_KEY || '' },
                //     priority: 10,
                // },
                {
                    use: MailtrapDriver,
                    config: {
                        token: process.env.MAILTRAP_TOKEN || '',
                        endpoint: process.env.MAILTRAP_ENDPOINT,
                        // testInboxId: process.env.MAILTRAP_TEST_INBOX_ID ? parseInt(process.env.MAILTRAP_TEST_INBOX_ID!) : undefined,
                    },
                    priority: 8,
                },
            ],
        },
    },
});

// Define User
const user = new User(
    'user_123',
    'Jeremiah',
    'jeremiaholisa453@gmail.com',
    '+2347045646767',
    'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
    '1234567890'
);

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
        const result = await notificationManager.send(user, new EmailOnlyNotification(user.name));

        console.log('\n📊 Result:', result.status);
        //  if (result.errors.size > 0) {
        //      // The event listener already logged the detailed errors nicely
        //  }

    } catch (error) {
        console.error('Fatal:', error);
    }
}

run();
