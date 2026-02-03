import { Notifiable } from 'townkrier-core';

export class User implements Notifiable {
    constructor(
        public id: string,
        public name: string,
        public email: string,
        public phone: string,
        public pushToken: string,
        public whatsappNumber: string
    ) { }
    [key: string]: unknown;

    routeNotificationFor(driver: string): string | string[] | undefined {
        switch (driver) {
            case 'email':
                return this.email;
            case 'sms':
                return this.phone;
            case 'push':
                return this.pushToken;
            case 'in-app':
                return this.id;
            case 'whatsapp':
                // Assuming social media drivers like Wasender/Whapi use phone numbers formatted accordingly
                return this.whatsappNumber;
            default:
                // Generic fallback or specific logic per driver key if needed
                if (driver === 'termii') return this.phone;
                if (driver === 'resend') return this.email;
                if (driver === 'mailtrap') return this.email;
                if (driver === 'smtp') return this.email;

                return undefined;
        }
    }
}
