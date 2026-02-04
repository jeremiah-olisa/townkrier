import { ResendMessage } from './interfaces/resend-message.interface';
import { ResendConfig } from './interfaces/resend-config.interface';
import { CreateEmailOptions } from 'resend';
import { NotificationException, NotificationErrorCode } from 'townkrier-core';

export class ResendMapper {
    /**
     * Maps internal message to Resend API payload
     */
    static toResendData(message: ResendMessage, config: ResendConfig): CreateEmailOptions {
        const from = message.from || config.from;
        if (!from) {
            throw new NotificationException(
                'From address is required',
                NotificationErrorCode.MISSING_REQUIRED_FIELD
            );
        }

        if (!message.to) {
            throw new NotificationException(
                'To address is required',
                NotificationErrorCode.MISSING_REQUIRED_FIELD
            );
        }

        if (!message.html && !message.text) {
            throw new NotificationException(
                'Email content (html or text) is required',
                NotificationErrorCode.MISSING_REQUIRED_FIELD
            );
        }

        const resendData = {
            from,
            to: message.to,
            subject: message.subject,
            html: message.html,
            text: message.text,
            cc: message.cc,
            bcc: message.bcc,
            replyTo: message.reply_to,
            attachments: message.attachments,
            headers: message.headers,
            tags: message.tags,
        };

        // Remove undefined keys
        Object.keys(resendData).forEach((key) => {
            if (resendData[key as keyof typeof resendData] === undefined) {
                delete resendData[key as keyof typeof resendData];
            }
        });

        // Validated strictly above, safe to cast to SDK type
        return resendData as CreateEmailOptions;
    }

    /**
     * Maps partial Resend API response to a standardized structure
     */
    static toChannelResponse(data: any): any {
        return data;
    }

    /**
     * Maps to final Success Result
     */
    static toSuccessResponse(apiResponse: any, originalRequest: ResendMessage): any {
        return {
            id: apiResponse.id || '',
            status: 'success',
            response: apiResponse,
            metadata: {
                to: originalRequest.to,
            }
        };
    }
}
