import { NotificationDriver, SendResult, Notifiable, Logger } from 'townkrier-core';
import axios, { AxiosInstance } from 'axios';
import { WaSendApiConfig } from './interfaces/wasendapi-config.interface';
import { WaSendApiMessage } from './interfaces/wasendapi-message.interface';

export class WaSendApiDriver implements NotificationDriver<WaSendApiConfig, WaSendApiMessage> {
    private client: AxiosInstance;
    private baseUrl: string;

    constructor(private config: WaSendApiConfig) {
        if (!this.config.apiKey) {
            throw new Error('WaSenderApiKeyMissing: API Key is required');
        }
        this.baseUrl = this.config.baseUrl || 'https://wasenderapi.com/api';
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Authorization': `Bearer ${this.config.apiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: 30000
        });
    }

    async send(notifiable: Notifiable, message: WaSendApiMessage, _config?: WaSendApiConfig): Promise<SendResult> {
        let to = message.to;

        if (!to) {
            const route = notifiable.routeNotificationFor('whatsapp') || notifiable.routeNotificationFor('wasender');
            if (Array.isArray(route)) {
                to = route[0] as string;
            } else {
                to = route as string;
            }
        }

        if (!to) {
            throw new Error('RecipientMissing: No WhatsApp recipient found');
        }

        const payload = {
            to,
            text: message.msg || message.message || message.text || '', // Map to 'text'
            // sender_id: this.config.senderId 
        };

        const endpoint = 'send-message';

        try {
            Logger.debug(`[WaSender] Sending to ${to}`);
            const response = await this.client.post(endpoint, payload);

            const messageId = response.data?.message_id || response.data?.id || '';
            const status = (response.data && !response.data.error) ? 'success' : 'failed';

            return {
                id: messageId,
                status: status,
                response: response.data
            };
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
            Logger.error(`[WaSender] Send Error: ${errorMessage}`, error.response?.data);

            return {
                id: '',
                status: 'failed',
                error: error.response?.data || error
            };
        }
    }

    static configure(config: WaSendApiConfig): WaSendApiConfig {
        return config;
    }
}
