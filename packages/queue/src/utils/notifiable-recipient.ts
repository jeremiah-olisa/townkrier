import { Notifiable, NotificationRecipient } from 'townkrier-core';

/**
 * Converts a NotificationRecipient to a Notifiable
 * This is used internally by the queue system to work with the NotificationManager
 */
export class NotifiableRecipient implements Notifiable {
    constructor(private recipient: NotificationRecipient) { }

    routeNotificationFor(driver: string): string | undefined {
        // Map common driver names to recipient properties
        switch (driver.toLowerCase()) {
            case 'email':
            case 'smtp':
            case 'mailtrap':
            case 'postmark':
            case 'resend':
                return this.recipient.email;

            case 'sms':
            case 'termii':
                return this.recipient.phone;

            case 'push':
            case 'fcm':
            case 'expo':
                return this.recipient.pushToken;

            case 'inapp':
            case 'sse':
            case 'database':
                return this.recipient.id;

            default:
                // Try to find a matching property in metadata
                if (this.recipient.metadata && this.recipient.metadata[driver]) {
                    return this.recipient.metadata[driver] as string;
                }
                return this.recipient.id || this.recipient.email || this.recipient.phone;
        }
    }

    // Allow access to original recipient properties
    [key: string]: unknown;
}
