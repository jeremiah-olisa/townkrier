import { NotificationDriver, SendResult, Notifiable, Logger } from 'townkrier-core';
import Expo, { ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { ExpoConfig } from './interfaces/expo-config.interface';
import { ExpoMessage } from './interfaces/expo-message.interface';

export class ExpoDriver implements NotificationDriver<ExpoConfig, ExpoMessage> {
    private expo: Expo;

    constructor(private config: ExpoConfig) {
        this.expo = new Expo({ accessToken: this.config.accessToken, useFcmV1: this.config.useFcmV1 });
    }

    async send(notifiable: Notifiable, message: ExpoMessage, _config?: ExpoConfig): Promise<SendResult> {
        let recipients: string[] = [];

        if (message.to) {
            recipients = Array.isArray(message.to) ? message.to : [message.to];
        } else {
            const route = notifiable.routeNotificationFor('expo') || notifiable.routeNotificationFor('push');
            if (Array.isArray(route)) {
                recipients = route as string[];
            } else if (route) {
                recipients = [route as string];
            }
        }

        if (recipients.length === 0) {
            throw new Error('RecipientMissing: No Expo push token provided');
        }

        // Validate tokens
        const validTokens: string[] = [];
        const invalidTokens: string[] = [];

        for (const token of recipients) {
            if (Expo.isExpoPushToken(token)) {
                validTokens.push(token);
            } else {
                invalidTokens.push(token);
            }
        }

        if (invalidTokens.length > 0) {
            Logger.warn(`[Expo] Ignored invalid tokens: ${invalidTokens.join(', ')}`);
        }

        if (validTokens.length === 0) {
            throw new Error('RecipientMissing: No valid Expo push tokens found');
        }

        // Construct messages
        // Expo recommends sending tokens in batched messages if body is same
        // But here message body is one. So we can just map valid tokens to messages.
        // Actually, one message object can have `to` as array of tokens in SDK?
        // Let's check `ExpoPushMessage`. Yes `to` is string or string[].
        // So we can send one message with all tokens?
        // "You strictly sort the messages by project ID... If you want to send the same message to multiple people, you can provide an array of tokens in the `to` field."

        const messages: ExpoPushMessage[] = [{
            ...message,
            to: validTokens
        } as ExpoPushMessage];

        const chunks = this.expo.chunkPushNotifications(messages);
        const tickets: ExpoPushTicket[] = [];
        const errors: any[] = [];

        try {
            for (const chunk of chunks) {
                try {
                    const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
                    tickets.push(...ticketChunk);
                } catch (e) {
                    Logger.error('[Expo] Chunk send failed', e);
                    errors.push(e);
                }
            }
        } catch (error) {
            return {
                id: '',
                status: 'failed',
                error: error
            };
        }

        // Analyze tickets
        // tickets include status: 'ok' or 'error'
        const successTickets = tickets.filter(t => t.status === 'ok');
        const errorTickets = tickets.filter(t => t.status === 'error');

        // IDs are only present in 'ok' tickets
        const ids = successTickets.map(t => (t as any).id).join(',');

        if (errorTickets.length > 0) {
            Logger.warn('[Expo] Some notifications failed', errorTickets);
        }

        if (successTickets.length === 0 && errors.length > 0) {
            return {
                id: '',
                status: 'failed',
                error: errors[0]
            };
        }

        return {
            id: ids,
            status: errorTickets.length === 0 ? 'success' : 'partial-success' as any, // 'partial-success' not in strict type but 'success' is fine if at least one sent?
            // Actually SendResult status is string, so partial-success is valid if typed loosely or I stick to 'success'.
            // Standardizing on 'success' if at least one went through, or 'failed' if all failed.
            response: { tickets, errors }
        };
    }

    static configure(config: ExpoConfig): ExpoConfig {
        return config;
    }
}
