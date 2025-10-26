"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InAppChannel = void 0;
exports.createInAppChannel = createInAppChannel;
const core_1 = require("@townkrier/core");
class InAppChannel extends core_1.DatabaseChannel {
    constructor(config) {
        if (!config.storage) {
            throw new core_1.NotificationConfigurationException('Storage adapter is required for in-app notifications', {
                channel: 'InApp',
            });
        }
        super({ ...config, apiKey: 'in-app' }, 'InApp');
        this.inAppConfig = config;
    }
    async sendInApp(request) {
        try {
            const recipients = Array.isArray(request.to) ? request.to : [request.to];
            if (recipients.length === 0) {
                throw new core_1.NotificationConfigurationException('No recipients provided', {
                    recipients,
                });
            }
            const recipient = recipients[0];
            const notificationId = (0, core_1.generateReference)('INAPP');
            const notification = {
                id: notificationId,
                userId: recipient.userId,
                title: request.title,
                message: request.message,
                type: request.type,
                actionUrl: request.actionUrl,
                icon: request.icon,
                data: request.data,
                status: 'sent',
                createdAt: new Date(),
            };
            const saved = await this.inAppConfig.storage.save(notification);
            const reference = request.reference || notificationId;
            return {
                success: true,
                notificationId: saved.id,
                reference,
                status: core_1.NotificationStatus.SENT,
                createdAt: saved.createdAt,
                metadata: (0, core_1.sanitizeMetadata)(request.metadata),
                raw: saved,
            };
        }
        catch (error) {
            return this.handleError(error, 'Failed to send in-app notification');
        }
    }
    async getNotifications(userId, limit = 20, offset = 0) {
        return this.inAppConfig.storage.getByUserId(userId, limit, offset);
    }
    async markAsRead(notificationId) {
        return this.inAppConfig.storage.markAsRead(notificationId);
    }
    async deleteNotification(notificationId) {
        return this.inAppConfig.storage.delete(notificationId);
    }
    handleError(error, defaultMessage) {
        if (error instanceof Error) {
            const notificationError = error;
            return {
                success: false,
                notificationId: '',
                status: core_1.NotificationStatus.FAILED,
                error: {
                    code: notificationError.code || 'IN_APP_ERROR',
                    message: error.message || defaultMessage,
                    details: notificationError.details || error,
                },
            };
        }
        return {
            success: false,
            notificationId: '',
            status: core_1.NotificationStatus.FAILED,
            error: {
                code: 'UNKNOWN_ERROR',
                message: defaultMessage,
                details: error,
            },
        };
    }
    isReady() {
        return !!this.inAppConfig.storage;
    }
}
exports.InAppChannel = InAppChannel;
function createInAppChannel(config) {
    return new InAppChannel(config);
}
//# sourceMappingURL=in-app-channel.js.map