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
        // Base URL should be the gate, endpoints are appended
        this.baseUrl = this.config.baseUrl || 'https://gate.whapi.cloud';

        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Authorization': `Bearer ${this.config.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            timeout: 30000
        });
    }

    async send(notifiable: Notifiable, message: WhapiMessage, _config?: WhapiConfig): Promise<SendResult> {
        let to = message.to;

        if (!to) {
            const route = notifiable.routeNotificationFor('whatsapp') || notifiable.routeNotificationFor('whapi');
            if (Array.isArray(route)) {
                to = route[0] as string;
            } else {
                to = route as string;
            }
        }

        if (!to) {
            throw new Error('RecipientMissing: No WhatsApp recipient found');
        }

        // Clean up common issues: remove + 
        if (!to.includes('@')) {
            to = to.replace(/[\+\s\(\)]/g, '');
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

        // Map message content to 'body' as expected by Whapi
        const body = message.body || message.msg || message.text || '';

        // Determine endpoint based on type
        let endpoint = '/messages/text';
        let payload: any = { to, body };

        if (type === 'image') {
            endpoint = '/messages/image';
            payload = { to, media: message.media, caption: body };
        } else if (type === 'document') {
            endpoint = '/messages/document';
            payload = { to, media: message.media, caption: body, filename: message.filename };
        } else if (type === 'audio') {
            endpoint = '/messages/audio';
            payload = { to, media: message.media };
        } else if (type === 'video') {
            endpoint = '/messages/video';
            payload = { to, media: message.media, caption: body };
        } else if (type === 'voice') {
            endpoint = '/messages/voice';
            payload = { to, media: message.media };
        }

        try {
            Logger.debug(`[Whapi] Sending ${type} to ${to} via ${endpoint}`);
            const response = await this.client.post(endpoint, payload);

            // Response handling matching the provided example
            const messageId =
                response.data?.message?.id ||
                response.data?.message?.message_id ||
                response.data?.id ||
                response.data?.message_id ||
                '';

            const status = (response.data?.sent !== false) ? 'success' : 'failed';

            return {
                id: messageId,
                status: status,
                response: response.data
            };
        } catch (error: any) {
            const errorMessage = error.response?.data?.error?.message || error.message || 'Unknown error';
            Logger.error(`[Whapi] Send Error: ${errorMessage}`, error.response?.data);

            return {
                id: '',
                status: 'failed',
                error: error.response?.data || error
            };
        }
    }

    static configure(config: WhapiConfig): WhapiConfig {
        return config;
    }
}
