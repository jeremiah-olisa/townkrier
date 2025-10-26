import { DatabaseChannel, SendInAppRequest, SendInAppResponse } from '@townkrier/core';
import { InAppConfig, InAppNotification } from '../types';
export declare class InAppChannel extends DatabaseChannel {
    private readonly inAppConfig;
    constructor(config: InAppConfig);
    sendInApp(request: SendInAppRequest): Promise<SendInAppResponse>;
    getNotifications(userId: string, limit?: number, offset?: number): Promise<InAppNotification[]>;
    markAsRead(notificationId: string): Promise<void>;
    deleteNotification(notificationId: string): Promise<void>;
    private handleError;
    isReady(): boolean;
}
export declare function createInAppChannel(config: InAppConfig): InAppChannel;
//# sourceMappingURL=in-app-channel.d.ts.map