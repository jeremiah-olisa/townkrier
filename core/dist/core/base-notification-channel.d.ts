import { INotificationChannel } from '../interfaces/notification-channel.interface';
import { NotificationChannelConfig } from '../interfaces/notification-config.interface';
import { SendEmailRequest, SendEmailResponse, SendSmsRequest, SendSmsResponse, SendPushRequest, SendPushResponse, SendInAppRequest, SendInAppResponse } from '../interfaces';
import { NotificationChannel } from '../types';
export declare abstract class BaseNotificationChannel implements INotificationChannel {
    protected config: NotificationChannelConfig;
    protected channelName: string;
    protected channelType: NotificationChannel;
    constructor(config: NotificationChannelConfig, channelName: string, channelType: NotificationChannel);
    protected validateConfig(): void;
    getChannelName(): string;
    getChannelType(): NotificationChannel;
    isReady(): boolean;
    abstract send(notification: SendEmailRequest | SendSmsRequest | SendPushRequest | SendInAppRequest): Promise<SendEmailResponse | SendSmsResponse | SendPushResponse | SendInAppResponse>;
}
//# sourceMappingURL=base-notification-channel.d.ts.map