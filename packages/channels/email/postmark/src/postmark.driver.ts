import { NotificationDriver, SendResult, Notifiable, } from 'townkrier-core';
import { ServerClient } from 'postmark';
import { PostmarkConfig } from './interfaces/postmark-config.interface';
import { PostmarkMessage } from './interfaces/postmark-message.interface';

export class PostmarkDriver implements NotificationDriver<PostmarkConfig, PostmarkMessage> {
    private client: ServerClient;

    constructor(private config: PostmarkConfig) {
        if (!config.serverToken) {
            throw new Error('PostmarkTokenMissing: Server Token is required');
        }
        this.client = new ServerClient(config.serverToken);
    }

    async send(notifiable: Notifiable, message: PostmarkMessage, _config?: PostmarkConfig): Promise<SendResult> {
        const route = notifiable.routeNotificationFor('email');
        const recipients = message.To || route;

        if (!recipients) {
            throw new Error('RecipientMissing: No recipient found');
        }

        const from = message.From || this.config.from;
        if (!from) {
            throw new Error('SenderMissing: From address is required');
        }

        try {
            const response = await this.client.sendEmail({
                ...message,
                From: from,
                To: recipients as string,
                Subject: message.Subject || '',
                TrackLinks: message.TrackLinks as any,
                Attachments: message.Attachments?.map(att => ({
                    ...att,
                    ContentID: att.ContentID || null
                })),
            });

            if (response.ErrorCode !== 0) {
                return {
                    id: '',
                    status: 'failed',
                    error: {
                        code: response.ErrorCode,
                        message: response.Message
                    },
                    response: response
                };
            }

            return {
                id: response.MessageID,
                status: 'success',
                response: response
            };
        } catch (error: any) {
            return {
                id: '',
                status: 'failed',
                error: error
            };
        }
    }
}
