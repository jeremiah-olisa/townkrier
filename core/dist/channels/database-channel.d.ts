import { IInAppChannel } from '../interfaces/notification-channel.interface';
import { BaseNotificationChannel } from '../core/base-notification-channel';
import { SendInAppRequest, SendInAppResponse } from '../interfaces';
import { NotificationChannelConfig } from '../interfaces';
export declare abstract class DatabaseChannel extends BaseNotificationChannel implements IInAppChannel {
    constructor(config: NotificationChannelConfig, channelName: string);
    abstract sendInApp(request: SendInAppRequest): Promise<SendInAppResponse>;
    send(notification: SendInAppRequest): Promise<SendInAppResponse>;
}
//# sourceMappingURL=database-channel.d.ts.map