import { Notifiable } from 'townkrier-core';

export interface UserProps {
    id: string;
    email?: string;
    phone?: string;
    name?: string;
    pushToken?: string;
}

export class User implements Notifiable {
    public id: string;
    public email?: string;
    public phone?: string;
    public name?: string;
    public pushToken?: string;
    [key: string]: any; // Index signature required by Notifiable

    constructor(props: UserProps) {
        this.id = props.id;
        this.email = props.email;
        this.phone = props.phone;
        this.name = props.name;
        this.pushToken = props.pushToken;
    }

    /**
     * Route notifications for specific channels
     */
    routeNotificationFor(channel: string): string | (string | object)[] | object | undefined {
        switch (channel) {
            case 'email':
            case 'mail':
                return this.email;

            case 'sms':
                return this.phone;

            case 'whatsapp':
                return this.phone;

            case 'push':
            case 'fcm':
            case 'expo':
                return this.pushToken;

            default:
                // Allow dynamic property access for other channels if they match property names
                if (this[channel]) {
                    return this[channel];
                }
                return undefined;
        }
    }
}
