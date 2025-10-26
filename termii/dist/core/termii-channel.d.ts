import { SmsChannel, SendSmsRequest, SendSmsResponse } from '@townkrier/core';
import { TermiiConfig } from '../types';
export declare class TermiiChannel extends SmsChannel {
    private readonly client;
    private readonly termiiConfig;
    private readonly baseUrl;
    constructor(config: TermiiConfig);
    sendSms(request: SendSmsRequest): Promise<SendSmsResponse>;
    private handleError;
}
export declare function createTermiiChannel(config: TermiiConfig): TermiiChannel;
//# sourceMappingURL=termii-channel.d.ts.map