import { Notification, Notifiable } from 'townkrier-core';
import { WaSendApiMessage } from 'townkrier-wasender';
import { WhapiMessage } from 'townkrier-whapi';

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

        // We return an object compatible with the primary driver (WaSender)
        // or potentially a structure that works for both if unified.
        // For now, adhering to WaSendApiMessage structure:
        return {
            to: phone,
            msg: messageText,
            // For Whapi, it might expect 'body'. Using 'any' cast or union strategy 
            // depends on how strict the shared interface is. 
            // In a real generic scenario, we might return a unified object that 
            // the driver maps, but here we explicitly return what fits.
            // Adding 'body' as well to satisfy Whapi if it checks:
            body: messageText,
        } as any;
    }
}
