import { INotificationChannel } from '../interfaces/notification-channel.interface';
import { SendEmailRequest, SendSmsRequest, SendPushRequest, SendInAppRequest, SendEmailResponse, SendSmsResponse, SendPushResponse, SendInAppResponse } from '../interfaces';
import { NotificationChannel } from '../types';
import { NotificationChannelConfig } from '../interfaces';
export interface SlackNotificationRequest {
    channel?: string;
    text: string;
    attachments?: unknown[];
}
export interface SlackNotificationResponse {
    success: boolean;
    ts?: string;
    error?: unknown;
    raw?: unknown;
}
export declare abstract class SlackChannel implements INotificationChannel {
    protected config: NotificationChannelConfig;
    protected channelName: string;
    protected channelType: NotificationChannel;
    constructor(config: NotificationChannelConfig, channelName: string);
    abstract sendSlack(request: SlackNotificationRequest): Promise<SlackNotificationResponse>;
    send(notification: SendEmailRequest | SendSmsRequest | SendPushRequest | SendInAppRequest): Promise<SendEmailResponse | SendSmsResponse | SendPushResponse | SendInAppResponse>;
    getChannelName(): string;
    getChannelType(): NotificationChannel;
    isReady(): boolean;
}
//# sourceMappingURL=slack-channel.d.ts.map