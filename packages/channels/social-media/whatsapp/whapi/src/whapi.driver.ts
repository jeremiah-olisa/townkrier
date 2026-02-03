import { NotificationDriver, SendResult, Notifiable, Logger } from 'townkrier-core';
import axios, { AxiosInstance } from 'axios';
import { WhapiConfig } from './interfaces/whapi-config.interface';
import { WhapiMessage } from './interfaces/whapi-message.interface';

export class WhapiDriver implements NotificationDriver<WhapiConfig, WhapiMessage> {
    private client: AxiosInstance;
    private baseUrl: string;

    constructor(private config: WhapiConfig) {
        if (!this.config.apiKey) {
            throw new Error('WhapiApiKeyMissing: API Key is required');
        }
        this.baseUrl = this.config.baseUrl || 'https://gate.whapi.cloud/messages';
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Authorization': `Bearer ${this.config.apiKey}`,
                'Content-Type': 'application/json',
            }
        });
    }

    async send(notifiable: Notifiable, message: WhapiMessage, _config?: WhapiConfig): Promise<SendResult> {
        let to = message.to;

        if (!to) {
            const route = notifiable.routeNotificationFor('whatsapp') || notifiable.routeNotificationFor('whapi');
            if (Array.isArray(route)) {
                to = route[0] as string; // Whapi typically one by one, loop in manager if needed or bulk endpoint if available
            } else {
                to = route as string;
            }
        }

        if (!to) {
            throw new Error('RecipientMissing: No WhatsApp recipient found');
        }

        // Whapi format often requires suffix if not present
        if (!to.includes('@')) {
            // Check if it looks like a group or person
            if (to.length > 15 || to.includes('-')) {
                to = `${to}@g.us`;
            } else {
                to = `${to}@s.whatsapp.net`;
            }
        }

        const type = message.type || (message.media ? 'image' : 'text');

        const payload: any = {
            to,
            ...message
        };

        // endpoint structure depends on type in Whapi, or generic /messages
        // Using generic /messages/text or /messages/image often

        let endpoint = '/text';
        if (type === 'image') endpoint = '/image';
        if (type === 'document') endpoint = '/document';
        if (type === 'audio') endpoint = '/audio';
        if (type === 'video') endpoint = '/video';
        if (type === 'voice') endpoint = '/voice';

        // NOTE: If using base URL https://gate.whapi.cloud/messages, then append endpoint

        try {
            Logger.debug(`[Whapi] Sending ${type} to ${to}`);
            const response = await this.client.post(endpoint, payload);

            // Success response usually contains { sent: true, message: { id: ... } }

            return {
                id: response.data?.message?.id || response.data?.id || '',
                status: 'success',
                response: response.data
            };
        } catch (error: any) {
            Logger.error('[Whapi] Send Error', error);
            return {
                id: '',
                status: 'failed',
                error: error.response?.data || error
            };
        }
    }
}
