import { IPushChannel } from '../interfaces/notification-channel.interface';
import { BaseNotificationChannel } from '../core/base-notification-channel';
import { SendPushRequest, SendPushResponse } from '../interfaces';
import { NotificationChannelConfig } from '../interfaces';
export declare abstract class PushChannel extends BaseNotificationChannel implements IPushChannel {
    constructor(config: NotificationChannelConfig, channelName: string);
    abstract sendPush(request: SendPushRequest): Promise<SendPushResponse>;
    send(notification: SendPushRequest): Promise<SendPushResponse>;
}
//# sourceMappingURL=push-channel.d.ts.map