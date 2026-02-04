import { Notification, Notifiable } from 'townkrier-core';
import { ResendMessage } from 'townkrier-resend';
import { MailtrapMessage } from 'townkrier-mailtrap';
import { TermiiMessage } from 'townkrier-termii';
import { ExpoMessage } from 'townkrier-expo';
import { SseMessage } from 'townkrier-sse';
import { WaSendApiMessage } from 'townkrier-wasender';
import { WhapiMessage } from 'townkrier-whapi';

export class WelcomeNotification extends Notification<
    'email' | 'sms' | 'push' | 'in-app' | 'whatsapp'
> {
    constructor(private userName: string) {
        super();
    }

    via(notifiable: Notifiable): ('email' | 'sms' | 'push' | 'in-app' | 'whatsapp')[] {
        return ['email', 'sms', 'push', 'in-app', 'whatsapp'];
    }

    // --- Email Converters ---

    toEmail(notifiable: Notifiable): ResendMessage | MailtrapMessage {
        const common = {
            subject: `Welcome ${this.userName}!`,
            html: `<h1>Welcome to Townkrier Updated!</h1><p>We are excited to have you on board.</p>`,
            to: notifiable.routeNotificationFor('email') as string,
            from: 'Townkrier <onboarding@resend.dev>', // Add valid sender
        };
        return common;
    }

    // --- SMS Converters ---

    toSms(notifiable: Notifiable): TermiiMessage {
        return {
            to: notifiable.routeNotificationFor('sms') as string,
            sms: `Hello ${this.userName}, welcome to Townkrier updated!`,
            // from is optional - will use the sender ID from driver config (TERMII_SENDER_ID env var)
        };
    }

    // --- Push Converters ---

    toPush(notifiable: Notifiable): ExpoMessage {
        return {
            to: notifiable.routeNotificationFor('push') as string,
            title: 'Welcome!',
            body: `Hello ${this.userName}, thanks for joining us updated!`,
            data: { userId: notifiable.id },
        };
    }

    // --- In-App Converters ---

    toInApp(notifiable: Notifiable): SseMessage {
        return {
            channelId: notifiable.id,
            title: 'Welcome!',
            message: `Welcome ${this.userName}! updated`,
            event: 'welcome',
            data: {
                timestamp: new Date().toISOString(),
            },
        };
    }

    // --- Social Media Converters ---

    toWhatsapp(notifiable: Notifiable): WaSendApiMessage | WhapiMessage {
        const phone = notifiable.routeNotificationFor('whatsapp') as string;
        return {
            to: phone, // Whapi/Wasender usage might vary, usually expects phone number
            body: `Hi ${this.userName}, welcome to Townkrier via WhatsApp updated!`,
        };
    }
}
