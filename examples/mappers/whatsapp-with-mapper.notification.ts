import { Notification, Notifiable } from 'townkrier-core';
import { UnifiedWhatsappMessage } from './unified-whatsapp.interface';

/**
 * Example: Notification using message mappers (RECOMMENDED APPROACH)
 * 
 * When using multiple drivers with different message interfaces,
 * use message mappers to keep notifications clean and type-safe.
 * 
 * Benefits:
 * - ✅ Type-safe: No 'as any' casts
 * - ✅ Single source of truth: Mappers configured once during setup
 * - ✅ Decoupled: Notifications don't know about driver-specific formats
 * - ✅ Flexible: Users define their own unified format
 * - ✅ Reusable: One mapper per driver, used across all notifications
 * 
 * How it works:
 * 1. Notification returns UnifiedWhatsappMessage (your common format)
 * 2. Framework gets the driver being used
 * 3. If a mapper is registered for that driver, it transforms the message
 * 4. Driver sends the transformed message
 * 
 * See ./whatsapp.mappers.ts for mapper implementations.
 * See ../whatsapp-with-mapper-config.ts for driver configuration example.
 */
export class WhatsappWithMapperNotification extends Notification<'whatsapp'> {
    constructor(private userName: string, private orderId: string) {
        super();
    }

    via(notifiable: Notifiable): 'whatsapp'[] {
        return ['whatsapp'];
    }

    /**
     * Return unified message format.
     * The framework will apply the mapper before sending to the driver.
     * ✅ No need for union types or 'as any' casts!
     */
    toWhatsapp(notifiable: Notifiable): UnifiedWhatsappMessage {
        const phone = notifiable.routeNotificationFor('whatsapp') as string;

        return {
            to: phone,
            text: `Hello *${this.userName}*! 👋\nYour order *#${this.orderId}* has been confirmed. We will notify you when it ships! 🚀`,
        };
    }
}
