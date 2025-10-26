import { ISmsChannel } from '../interfaces/notification-channel.interface';
import { BaseNotificationChannel } from '../core/base-notification-channel';
import { SendSmsRequest, SendSmsResponse } from '../interfaces';
import { NotificationChannelConfig } from '../interfaces';
export declare abstract class SmsChannel extends BaseNotificationChannel implements ISmsChannel {
    constructor(config: NotificationChannelConfig, channelName: string);
    abstract sendSms(request: SendSmsRequest): Promise<SendSmsResponse>;
    send(notification: SendSmsRequest): Promise<SendSmsResponse>;
}
//# sourceMappingURL=sms-channel.d.ts.map