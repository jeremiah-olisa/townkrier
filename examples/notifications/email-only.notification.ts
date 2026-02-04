
import { Notification, Notifiable } from 'townkrier-core';
import { ResendMessage } from 'townkrier-resend';
import { MailtrapMessage } from 'townkrier-mailtrap';

export class EmailOnlyNotification extends Notification<'email'> {
    constructor(private userName: string) {
        super();
    }

    via(notifiable: Notifiable): 'email'[] {
        return ['email'];
    }

    toEmail(notifiable: Notifiable): ResendMessage | MailtrapMessage {
        const common: ResendMessage | MailtrapMessage = {
            subject: `Welcome ${this.userName}!`,
            html: `<h1>Welcome to Townkrier!</h1><p>We are excited to have you on board.</p>`,
            to: notifiable.routeNotificationFor('email') as string,
            from: 'Townkrier <townkrier@monievault.com>',
        };
        return common;
    }
}
