import { NotificationDriver, SendResult, Notifiable, Logger } from 'townkrier-core';
import { DatabaseConfig, InAppNotificationData } from './interfaces/database-config.interface';
import { DatabaseMessage } from './interfaces/database-message.interface';

export class DatabaseDriver implements NotificationDriver<DatabaseConfig, DatabaseMessage> {
    constructor(private config: DatabaseConfig) {
        if (!config.storageAdapter) {
            throw new Error('DatabaseAdapterMissing: Storage adapter is required');
        }
    }

    async send(notifiable: Notifiable, message: DatabaseMessage, _config?: DatabaseConfig): Promise<SendResult> {
        let userId = message.userId;

        if (!userId) {
            const route = notifiable.routeNotificationFor('database') || notifiable.routeNotificationFor('inApp');
            if (Array.isArray(route)) {
                // Technically single user per request is standard, but if array, handle first or error?
                // The current InApp channel handles array logic by returning first ID. 
                // Let's support array logic or just first for now, assume route returns userId string.
                userId = route[0] as string;
            } else {
                userId = route as string;
            }
        }

        // If notifiable has 'id' property and route is undefined, maybe use that?
        // Standard is routeNotificationFor.

        if (!userId) {
            // Check if notifiable is user-like object
            if ((notifiable as any).id) {
                userId = (notifiable as any).id;
            } else {
                throw new Error('RecipientMissing: No user ID found for database notification');
            }
        }

        const notificationData: InAppNotificationData = {
            userId: userId as string,
            title: message.title,
            message: message.message,
            type: message.type,
            actionUrl: message.actionUrl,
            icon: message.icon,
            data: message.data,
            read: false,
            createdAt: new Date(),
            metadata: message.metadata,
        };

        try {
            const id = await this.config.storageAdapter.save(notificationData);

            return {
                id,
                status: 'success',
                response: { notificationId: id }
            };
        } catch (error: any) {
            Logger.error('[DatabaseDriver] Save Error', error);
            return {
                id: '',
                status: 'failed',
                error: error
            };
        }
    }

    // Helper methods for retrieval if needed, but Driver interface is primarily for sending.
    // Consumers can access storage adapter directly for retrieval or we can expose it.

    getStorageAdapter() {
        return this.config.storageAdapter;
    }

    static configure(config: DatabaseConfig): DatabaseConfig {
        return config;
    }
}
