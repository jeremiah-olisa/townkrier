import { Notification, Notifiable } from 'townkrier-core';
import { TermiiMessage } from 'townkrier-termii';

export class SmsOnlyNotification extends Notification<'sms'> {
    constructor(private userName: string, private otpCode: string) {
        super();
    }

    via(notifiable: Notifiable): 'sms'[] {
        return ['sms'];
    }

    toSms(notifiable: Notifiable): TermiiMessage {
        const phone = notifiable.routeNotificationFor('sms') as string;

        return {
            to: phone,
            sms: `Hi ${this.userName}, your Townkrier verification code is ${this.otpCode}. Valid for 10 minutes.`,
            // from is optional - will use the sender ID from driver config (TERMII_SENDER_ID env var)
        };
    }
}
