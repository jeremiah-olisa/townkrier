import {
    NotificationManager,
    FallbackStrategyConfig,
    CompositeFallbackDriver,
    FallbackStrategy,
} from 'townkrier-core';
import {
    WhapiMessageMapper,
    WaSendApiMessageMapper,
} from './mappers/whatsapp.mappers';
import { WhatsappWithMapperNotification } from './mappers/whatsapp-with-mapper.notification';
import { WhapiDriver } from 'townkrier-whapi';
import { WaSendApiDriver } from 'townkrier-wasender';

/**
 * Example: Configuring WhatsApp drivers with mappers
 * 
 * This example demonstrates how to:
 * 1. Register driver classes (not instances) with static configure() method
 * 2. Register mapper classes (framework handles instantiation)
 * 3. Set up fallback strategy between multiple drivers
 * 4. Send notifications using the unified message format
 * 
 * The notification returns UnifiedWhatsappMessage, and the framework
 * automatically applies the correct mapper before sending to each driver.
 * 
 * Benefits of this DX:
 * ✅ No manual instantiation - framework handles it
 * ✅ Clean, declarative configuration
 * ✅ Type-safe with static configure() methods
 * ✅ Mappers registered once, used everywhere
 */

async function setupNotificationManager() {
    // Configure fallback strategy with mappers
    // Framework handles driver and mapper instantiation
    const fallbackConfig: FallbackStrategyConfig = {
        strategy: FallbackStrategy.PriorityFallback, // Try Whapi first, then WaSend
        drivers: [
            {
                use: WhapiDriver,
                config: WhapiDriver.configure({
                    apiUrl: process.env.WHAPI_URL || 'https://gate.whapi.cloud',
                    apiKey: process.env.WHAPI_TOKEN || '',
                }),
                priority: 10,
                enabled: true,
                // Register mapper class: UnifiedWhatsappMessage → WhapiMessage
                mapper: WhapiMessageMapper,
            },
            {
                use: WaSendApiDriver,
                config: WaSendApiDriver.configure({
                    apiKey: process.env.WASENDER_API_KEY || '',
                    device: process.env.WASENDER_DEVICE || 'default',
                    baseUrl: process.env.WASENDER_API_URL || 'https://api.wasender.com',
                }),
                priority: 5,
                enabled: true,
                // Register mapper class: UnifiedWhatsappMessage → WaSendApiMessage
                mapper: WaSendApiMessageMapper,
            },
        ],
    };

    // Initialize notification manager with composite driver
    const notificationManager = new NotificationManager({
        channels: {
            whatsapp: fallbackConfig, // Pass the config directly, not instantiated CompositeFallbackDriver
        },
    });

    return notificationManager;
}

/**
 * Send a notification using the mapper pattern
 */
async function sendOrderConfirmationNotification() {
    const notificationManager = await setupNotificationManager();

    // Define a notifiable user
    const user = {
        id: '123',
        name: 'John Doe',
        routeNotificationFor(channel: string) {
            if (channel === 'whatsapp') {
                return '+1234567890'; // User's WhatsApp phone number
            }
            return null;
        },
    };

    try {
        // Send notification
        // The notification returns UnifiedWhatsappMessage
        // The framework applies the appropriate mapper based on which driver is used
        await notificationManager.send(
            user,
            new WhatsappWithMapperNotification('John', 'ORD-12345')
        );

        console.log('✅ Notification sent successfully!');
    } catch (error) {
        console.error('❌ Failed to send notification:', error);
    }
}

/**
 * TYPE SAFETY BENEFIT COMPARISON
 * 
 * WITHOUT MAPPERS (single driver):
 * ```typescript
 * toWhatsapp(): WhatsappMessage {  // Type locked to Whapi format
 *   return { to: '+123...', body: 'Text' };
 * }
 * ```
 * Problem: Need to know driver-specific types
 * 
 * WITH MAPPERS (multiple drivers):
 * ```typescript
 * // Configuration (once)
 * {
 *   use: WhapiDriver,
 *   config: WhapiDriver.configure({ ... }),
 *   mapper: WhapiMessageMapper,  // ← Register class, not instance
 * }
 * 
 * // Notification (everywhere)
 * toWhatsapp(): UnifiedWhatsappMessage {  // User-defined type
 *   return { to: '+123...', text: 'Text' };
 * }
 * ```
 * Benefits:
 * ✅ Type-safe (no 'as any' needed)
 * ✅ Declarative configuration (use, config, mapper)
 * ✅ Framework handles instantiation
 * ✅ Mappers handle transformation automatically
 * ✅ Can swap drivers without changing notifications
 */

// Export for testing
export { setupNotificationManager, sendOrderConfirmationNotification };
