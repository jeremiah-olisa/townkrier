import { SendEmailRequest, SendSmsRequest, SendPushRequest, SendInAppRequest } from './notification-request.interface';
import { SendEmailResponse, SendSmsResponse, SendPushResponse, SendInAppResponse } from './notification-response.interface';
import { NotificationChannel } from '../types';
export interface INotificationChannel {
    send(notification: SendEmailRequest | SendSmsRequest | SendPushRequest | SendInAppRequest): Promise<SendEmailResponse | SendSmsResponse | SendPushResponse | SendInAppResponse>;
    getChannelName(): string;
    getChannelType(): NotificationChannel;
    isReady(): boolean;
}
export interface IEmailChannel extends INotificationChannel {
    sendEmail(request: SendEmailRequest): Promise<SendEmailResponse>;
}
export interface ISmsChannel extends INotificationChannel {
    sendSms(request: SendSmsRequest): Promise<SendSmsResponse>;
}
export interface IPushChannel extends INotificationChannel {
    sendPush(request: SendPushRequest): Promise<SendPushResponse>;
}
export interface IInAppChannel extends INotificationChannel {
    sendInApp(request: SendInAppRequest): Promise<SendInAppResponse>;
}
//# sourceMappingURL=notification-channel.interface.d.ts.map