import { NotificationDriver, SendResult, Notifiable, Logger } from 'townkrier-core';
import * as admin from 'firebase-admin';
import { FcmConfig } from './interfaces/fcm-config.interface';
import { FcmMessage } from './interfaces/fcm-message.interface';

export class FcmDriver implements NotificationDriver<FcmConfig, FcmMessage> {
    private app: admin.app.App;

    constructor(private config: FcmConfig) {
        if (!config.serviceAccount && !config.serviceAccountPath) {
            // throw new Error('FcmConfigurationError: Service account or path required');
            // Actually, applicationDefault might be used if nothing provided?
            // Legacy channel threw error if neither provided.
        }

        try {
            const credential = config.serviceAccount
                ? admin.credential.cert(config.serviceAccount)
                : config.serviceAccountPath
                    ? admin.credential.cert(config.serviceAccountPath)
                    : admin.credential.applicationDefault();

            this.app = admin.initializeApp({
                credential,
                projectId: config.projectId,
                databaseURL: config.databaseURL,
            }, `fcm-${Date.now()}`); // Unique name to allow multiple instances/reloads
        } catch (error: any) {
            throw new Error(`FcmInitializationError: ${error.message}`);
        }
    }

    async send(notifiable: Notifiable, message: FcmMessage, _config?: FcmConfig): Promise<SendResult> {
        // Resolve tokens
        let tokens: string[] = [];

        if (message.token) {
            tokens.push(message.token);
        } else if (message.tokens && message.tokens.length > 0) {
            tokens = message.tokens;
        } else {
            const route = notifiable.routeNotificationFor('fcm') || notifiable.routeNotificationFor('push');
            if (Array.isArray(route)) {
                tokens = route as string[];
            } else if (route) {
                tokens = [route as string];
            }
        }

        // If no tokens AND no topic/condition, then we can't send.
        // But topic/condition are alternatives to token.
        if (tokens.length === 0 && !message.topic && !message.condition) {
            throw new Error('RecipientMissing: No FCM token, topic, or condition provided');
        }

        try {
            let response: any;
            let id = '';

            // Clean message for sending (remove custom properties if needed)
            const { token, tokens: _tokens, ...fcmPayload } = message;

            if (tokens.length === 1) {
                // Single send
                const messagePayload = { ...fcmPayload, token: tokens[0] } as admin.messaging.Message;
                id = await admin.messaging(this.app).send(messagePayload);
                response = { name: id };
            } else if (tokens.length > 1) {
                // Multicast
                const multicastPayload = { ...fcmPayload, tokens: tokens } as admin.messaging.MulticastMessage;
                const batchResponse = await admin.messaging(this.app).sendEachForMulticast(multicastPayload);
                response = batchResponse;
                // ID for batch? Maybe comma separated or just count
                id = `${batchResponse.successCount} sent`;

                if (batchResponse.failureCount > 0) {
                    // Partial failure handling?
                    // Verify if we should return failure or success with details
                }
            } else {
                // Topic or Condition
                const topicPayload = { ...fcmPayload } as admin.messaging.Message;
                // (Topic/Condition are part of BaseMessage so included in ...fcmPayload)

                id = await admin.messaging(this.app).send(topicPayload);
                response = { name: id };
            }

            return {
                id,
                status: 'success',
                response
            };
        } catch (error: any) {
            Logger.error('[FCM] Send Error', error);
            return {
                id: '',
                status: 'failed',
                error: error
            };
        }
    }

    static configure(config: FcmConfig): FcmConfig {
        return config;
    }
}
