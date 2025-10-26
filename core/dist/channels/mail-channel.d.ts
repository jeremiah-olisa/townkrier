import { IEmailChannel } from '../interfaces/notification-channel.interface';
import { BaseNotificationChannel } from '../core/base-notification-channel';
import { SendEmailRequest, SendEmailResponse } from '../interfaces';
import { NotificationChannelConfig } from '../interfaces';
export declare abstract class MailChannel extends BaseNotificationChannel implements IEmailChannel {
    constructor(config: NotificationChannelConfig, channelName: string);
    abstract sendEmail(request: SendEmailRequest): Promise<SendEmailResponse>;
    send(notification: SendEmailRequest): Promise<SendEmailResponse>;
}
//# sourceMappingURL=mail-channel.d.ts.map