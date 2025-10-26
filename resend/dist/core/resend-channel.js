"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResendChannel = void 0;
exports.createResendChannel = createResendChannel;
const resend_1 = require("resend");
const core_1 = require("@townkrier/core");
class ResendChannel extends core_1.MailChannel {
    constructor(config) {
        if (!config.apiKey) {
            throw new core_1.NotificationConfigurationException('API key is required for Resend', {
                channel: 'Resend',
            });
        }
        super(config, 'Resend');
        this.resendConfig = config;
        this.client = new resend_1.Resend(config.apiKey);
    }
    async sendEmail(request) {
        try {
            const recipients = Array.isArray(request.to) ? request.to : [request.to];
            for (const recipient of recipients) {
                if (!(0, core_1.isValidEmail)(recipient.email)) {
                    throw new core_1.NotificationConfigurationException(`Invalid email address: ${recipient.email}`, { email: recipient.email });
                }
            }
            const from = request.from
                ? `${request.from.name ? `${request.from.name} <${request.from.email}>` : request.from.email}`
                : this.resendConfig.from
                    ? `${this.resendConfig.fromName ? `${this.resendConfig.fromName} <${this.resendConfig.from}>` : this.resendConfig.from}`
                    : '';
            if (!from) {
                throw new core_1.NotificationConfigurationException('From email address is required', { channel: 'Resend' });
            }
            const emailData = {
                from,
                to: recipients.map((r) => (r.name ? `${r.name} <${r.email}>` : r.email)),
                subject: request.subject,
                html: request.html,
                text: request.text || request.html || request.subject,
            };
            if (request.cc && request.cc.length > 0) {
                emailData.cc = request.cc.map((r) => (r.name ? `${r.name} <${r.email}>` : r.email));
            }
            if (request.bcc && request.bcc.length > 0) {
                emailData.bcc = request.bcc.map((r) => (r.name ? `${r.name} <${r.email}>` : r.email));
            }
            if (request.replyTo) {
                emailData.reply_to = request.replyTo.name
                    ? `${request.replyTo.name} <${request.replyTo.email}>`
                    : request.replyTo.email;
            }
            if (request.attachments && request.attachments.length > 0) {
                emailData.attachments = request.attachments.map((att) => ({
                    filename: att.filename,
                    content: att.content,
                    path: att.path,
                }));
            }
            if (request.metadata) {
                const sanitized = (0, core_1.sanitizeMetadata)(request.metadata);
                if (sanitized) {
                    emailData.tags = Object.entries(sanitized).map(([name, value]) => ({
                        name,
                        value: String(value),
                    }));
                }
            }
            const response = await this.client.emails.send(emailData);
            if (!response.data) {
                throw new core_1.NotificationInvalidResponseError('No response data from Resend', undefined, response);
            }
            const data = response.data;
            const reference = request.reference || (0, core_1.generateReference)('EMAIL');
            return {
                success: true,
                messageId: data.id,
                reference,
                status: core_1.NotificationStatus.SENT,
                sentAt: new Date(data.created_at),
                metadata: request.metadata,
                raw: response,
            };
        }
        catch (error) {
            return this.handleError(error, 'Failed to send email');
        }
    }
    handleError(error, defaultMessage) {
        if (error instanceof Error) {
            const resendError = error;
            return {
                success: false,
                messageId: '',
                status: core_1.NotificationStatus.FAILED,
                error: {
                    code: 'RESEND_ERROR',
                    message: error.message || defaultMessage,
                    details: {
                        statusCode: resendError.statusCode,
                        error: error,
                    },
                },
            };
        }
        return {
            success: false,
            messageId: '',
            status: core_1.NotificationStatus.FAILED,
            error: {
                code: 'UNKNOWN_ERROR',
                message: defaultMessage,
                details: error,
            },
        };
    }
}
exports.ResendChannel = ResendChannel;
function createResendChannel(config) {
    return new ResendChannel(config);
}
//# sourceMappingURL=resend-channel.js.map