import { NotificationDriver, SendResult, Notifiable } from 'townkrier-core';
import * as nodemailer from 'nodemailer';
import { SmtpConfig } from './interfaces/smtp-config.interface';
import { SmtpMessage } from './interfaces/smtp-message.interface';

export class SmtpDriver implements NotificationDriver<SmtpConfig, SmtpMessage> {
    private transporter: nodemailer.Transporter;

    constructor(private config: SmtpConfig) {
        if (!config.host || !config.port) {
            throw new Error('SmtpConfigurationMissing: Host and Port are required');
        }
        this.transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.secure ?? false,
            auth: config.auth,
        });
    }

    async send(notifiable: Notifiable, message: SmtpMessage, _config?: SmtpConfig): Promise<SendResult> {
        const route = notifiable.routeNotificationFor('email');
        const recipient = message.to || route;

        if (!recipient) {
            throw new Error('RecipientMissing: No recipient found for email');
        }

        const from = message.from || this.config.from;
        if (!from) {
            throw new Error('SenderMissing: From address is required');
        }

        try {
            const mailOptions = {
                from,
                to: recipient as string,
                cc: message.cc,
                bcc: message.bcc,
                subject: message.subject,
                text: message.text,
                html: message.html,
                attachments: message.attachments,
                replyTo: message.replyTo,
                headers: message.headers,
            };

            const info = await this.transporter.sendMail(mailOptions);

            return {
                id: info.messageId || '',
                status: 'success',
                response: info
            };
        } catch (error) {
            return {
                id: '',
                status: 'failed',
                error: error
            };
        }
    }

    static configure(config: SmtpConfig): SmtpConfig {
        return config;
    }
}
