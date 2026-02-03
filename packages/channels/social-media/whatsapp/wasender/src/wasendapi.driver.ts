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
        this.baseUrl = this.config.baseUrl || 'https://wasendapi.io/api';
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Content-Type': 'application/json',
            }
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
            api_key: this.config.apiKey,
            device: this.config.device,
            gateway: this.config.gateway || '1',
            nonce: Date.now().toString(),
            to,
            msg: message.msg,
            type: message.type || 'text',
            url: message.url,
            schedule: message.schedule,
        };

        const endpoint = '/send-message';
        // Some APIs have specific endpoints for media

        try {
            Logger.debug(`[WaSender] Sending to ${to}`);
            const response = await this.client.post(endpoint, payload);

            // Response format check needed, assuming standard JSON success

            return {
                id: response.data?.id || '',
                status: 'success',
                response: response.data
            };
        } catch (error: any) {
            Logger.error('[WaSender] Send Error', error);
            return {
                id: '',
                status: 'failed',
                error: error.response?.data || error
            };
        }
    }
}
