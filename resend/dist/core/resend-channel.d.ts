import { MailChannel, SendEmailRequest, SendEmailResponse } from '@townkrier/core';
import { ResendConfig } from '../types';
export declare class ResendChannel extends MailChannel {
    private readonly client;
    private readonly resendConfig;
    constructor(config: ResendConfig);
    sendEmail(request: SendEmailRequest): Promise<SendEmailResponse>;
    private handleError;
}
export declare function createResendChannel(config: ResendConfig): ResendChannel;
//# sourceMappingURL=resend-channel.d.ts.map