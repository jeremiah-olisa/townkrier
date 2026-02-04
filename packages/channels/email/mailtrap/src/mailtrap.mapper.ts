import { MailtrapMessage } from './interfaces/mailtrap-message.interface';
import { MailtrapConfig } from './interfaces/mailtrap-config.interface';
import { Mail, Address } from 'mailtrap';

export class MailtrapMapper {
    /**
     * Maps the internal message structure to the Mailtrap specific payload
     */
    static toMailtrapData(
        message: MailtrapMessage,
        config: MailtrapConfig
    ): Mail {
        // Construct basic logic needed for Mailtrap send API
        const mailtrapData: Mail = {
            subject: message.subject,
            text: message.text,
            html: message.html,
            to: this.normalizeAddress(message.to),
            from: this.normalizeAddress(message.from || config.from)[0] || config.from,
            headers: message.headers,
            custom_variables: message.custom_variables,
            category: message.category,
        };

        // Handling attachments if any
        if (message.attachments) {
            mailtrapData.attachments = message.attachments;
        }

        // Add CC/BCC if present
        if (message.cc) mailtrapData.cc = this.normalizeAddress(message.cc);
        if (message.bcc) mailtrapData.bcc = this.normalizeAddress(message.bcc);

        // Clean up undefined properties
        const data = mailtrapData as any;
        Object.keys(data).forEach(key =>
            data[key] === undefined && delete data[key]
        );

        return mailtrapData;
    }

    private static normalizeAddress(address: string | Address | (string | Address)[] | undefined): Address[] {
        if (!address) return [];
        if (Array.isArray(address)) {
            return address.map(addr => typeof addr === 'string' ? { email: addr } : addr);
        }
        return typeof address === 'string' ? [{ email: address }] : [address];
    }

    /**
     * Maps Mailtrap API response to unified response format
     */
    static toSuccessResponse(response: any, message: MailtrapMessage): any {
        return {
            id: response.message_ids?.[0] || '',
            status: 'success',
            response: response,
            metadata: {
                messageIds: response.message_ids,
                to: message.to,
            }
        };
    }
}
