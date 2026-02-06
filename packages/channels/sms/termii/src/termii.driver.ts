import { NotificationDriver, SendResult, Notifiable, Logger } from 'townkrier-core';
import axios, { AxiosInstance } from 'axios';
import { TermiiConfig } from './interfaces/termii-config.interface';
import { TermiiMessage } from './interfaces/termii-message.interface';

export class TermiiDriver implements NotificationDriver<TermiiConfig, TermiiMessage> {
    private client: AxiosInstance;
    private baseUrl: string;

    constructor(private config: TermiiConfig) {
        if (!config.apiKey) {
            throw new Error('TermiiApiKeyMissing: API Key is required');
        }
        this.baseUrl = config.baseUrl || 'https://api.ng.termii.com';
        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: config.timeout || 30000,
            headers: {
                'Content-Type': 'application/json',
            }
        });
    }

    async send(notifiable: Notifiable, message: TermiiMessage, _config?: TermiiConfig): Promise<SendResult> {
        const route = notifiable.routeNotificationFor('sms');
        const recipients = message.to || route;

        if (!recipients) {
            throw new Error('RecipientMissing: No recipient found for SMS');
        }

        const from = message.from || this.config.from;
        if (!from) {
            throw new Error('SenderMissing: From (Sender ID) is required');
        }

        const payload = {
            ...message,
            api_key: this.config.apiKey,
            to: recipients,
            from: from,
            sms: message.sms,
            type: message.type || this.config.type || 'plain',
            channel: message.channel || this.config.channel || 'generic',
            media: message.media || this.config.media,
        };

        const endpoint = Array.isArray(recipients) ? '/api/sms/send/bulk' : '/api/sms/send';

        try {
            Logger.debug('[Termii] Sending request', { endpoint, to: recipients });
            const response = await this.client.post(endpoint, payload);

            if (!response.data || !response.data.message_id) {
                // Handle cases where Termii returns 200 but with error message
                if (response.data && response.data.message && !response.data.message_id) {
                    throw new Error(response.data.message);
                }
            }

            return {
                id: response.data.message_id || '',
                status: 'success',
                response: response.data
            };
        } catch (error: any) {
            // Enhanced error handling
            let errorMessage = 'Failed to send SMS';

            if (axios.isAxiosError(error) && error.response) {
                const errorData = error.response.data;
                let message = errorData?.message || errorData?.error || error.message;

                // If message is an object, stringify it
                if (typeof message === 'object') {
                    message = JSON.stringify(message);
                }
                errorMessage = message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            Logger.error('[Termii] Error', { message: errorMessage, response: error.response?.data });

            return {
                id: '',
                status: 'failed',
                error: {
                    message: errorMessage,
                    raw: error.response?.data || error
                }
            };
        }
    }

    static configure(config: TermiiConfig): TermiiConfig {
        return config;
    }
}
