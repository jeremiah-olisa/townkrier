import { TownkrierFactory, DeliveryStrategy, FallbackStrategy } from 'townkrier-core';
import { ResendDriver } from 'townkrier-resend';
import { MailtrapDriver } from 'townkrier-mailtrap';
import { TermiiDriver } from 'townkrier-termii';
import { ExpoDriver } from 'townkrier-expo';
import { SseDriver } from 'townkrier-sse';
import { WaSendApiDriver } from 'townkrier-wasender';
import { WhapiDriver } from 'townkrier-whapi';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '.env') });

export const notificationManager = TownkrierFactory.create({
    strategy: DeliveryStrategy.BestEffort,
    channels: {
        email: {
            strategy: FallbackStrategy.PriorityFallback,
            drivers: [
                {
                    use: ResendDriver,
                    config: { apiKey: process.env.RESEND_API_KEY || '' },
                    priority: 10,
                },
                {
                    use: MailtrapDriver,
                    config: {
                        token: process.env.MAILTRAP_TOKEN || '',
                        testInboxId: process.env.MAILTRAP_TEST_INBOX_ID ? parseInt(process.env.MAILTRAP_TEST_INBOX_ID) : undefined,
                    },
                    priority: 8,
                },
            ],
        },
        sms: {
            strategy: FallbackStrategy.RoundRobin,
            drivers: [
                {
                    use: TermiiDriver,
                    config: {
                        apiKey: process.env.TERMII_API_KEY || '',
                        senderId: process.env.TERMII_SENDER_ID || 'Townkrier',
                    },
                },
            ],
        },
        push: {
            strategy: FallbackStrategy.RoundRobin,
            drivers: [
                {
                    use: ExpoDriver,
                    config: { accessToken: process.env.EXPO_ACCESS_TOKEN || '' },
                },
            ],
        },
        'in-app': {
            strategy: FallbackStrategy.RoundRobin,
            drivers: [
                {
                    use: SseDriver,
                    config: { port: process.env.SSE_PORT ? parseInt(process.env.SSE_PORT) : 3000 },
                },
            ],
        },
        'whatsapp': {
            strategy: FallbackStrategy.PriorityFallback,
            drivers: [
                {
                    use: WaSendApiDriver,
                    config: {
                        apiUrl: process.env.WASENDER_API_URL || '',
                        apiKey: process.env.WASENDER_API_KEY || '',
                    },
                    priority: 1,
                },
                {
                    use: WhapiDriver,
                    config: {
                        apiUrl: process.env.WHAPI_API_URL || '',
                        token: process.env.WHAPI_TOKEN || '',
                    },
                    priority: 2,
                },
            ],
        },
    },
});
