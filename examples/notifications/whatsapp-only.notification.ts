import { Notification, Notifiable } from 'townkrier-core';
import { WaSendApiMessage } from 'townkrier-wasender';
import { WhapiMessage } from 'townkrier-whapi';

/**
 * Multi-Driver Example WITHOUT Mappers
 * 
 * This example demonstrates a WhatsApp channel with MULTIPLE drivers (WaSender and Whapi)
 * that have different message interfaces, without using mappers.
 * 
 * To support both drivers, the handler returns an object containing ALL driver-specific properties:
 * - `msg`: Required by WaSender
 * - `body`: Required by Whapi
 * 
 * This approach works but has drawbacks:
 * 1. The return type is a union (WaSendApiMessage | WhapiMessage) with overlapping properties
 * 2. Extra properties must be added to satisfy both drivers
 * 3. Requires `as any` cast to suppress type errors
 * 4. Not type-safe—you might forget to add a property for a new driver
 * 
 * BETTER APPROACH: Use mappers (see whatsapp-with-mapper.notification.ts)
 * With mappers, you define your own unified message interface and each driver
 * has a mapper to transform it to the driver-specific format. This is cleaner,
 * type-safe, and scales better as you add more drivers.
 */
export class WhatsappOnlyNotification extends Notification<'whatsapp'> {
    constructor(private userName: string, private orderId: string) {
        super();
    }

    via(notifiable: Notifiable): 'whatsapp'[] {
        return ['whatsapp'];
    }

    toWhatsapp(notifiable: Notifiable): WaSendApiMessage | WhapiMessage {
        const phone = notifiable.routeNotificationFor('whatsapp') as string;
        const messageText = `Hello *${this.userName}*! 👋\nYour order *#${this.orderId}* has been confirmed. We will notify you when it ships! 🚀`;

        // ⚠️ Without mappers: You need union type and 'as any' hack
        return {
            to: phone,
            msg: messageText,     // For WaSender
            body: messageText,    // For Whapi
        } as any;
    }
}

