import { PushChannel, SendPushRequest, SendPushResponse } from '@townkrier/core';
import { FcmConfig } from '../types';
export declare class FcmChannel extends PushChannel {
    private readonly fcmConfig;
    private app;
    constructor(config: FcmConfig);
    sendPush(request: SendPushRequest): Promise<SendPushResponse>;
    private handleError;
    destroy(): Promise<void>;
}
export declare function createFcmChannel(config: FcmConfig): FcmChannel;
//# sourceMappingURL=fcm-channel.d.ts.map