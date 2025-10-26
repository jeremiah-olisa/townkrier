"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FcmChannel = void 0;
exports.createFcmChannel = createFcmChannel;
const admin = __importStar(require("firebase-admin"));
const core_1 = require("@townkrier/core");
class FcmChannel extends core_1.PushChannel {
    constructor(config) {
        if (!config.serviceAccount && !config.serviceAccountPath) {
            throw new core_1.NotificationConfigurationException('Service account credentials or path is required for FCM', {
                channel: 'FCM',
            });
        }
        super(config, 'FCM');
        this.fcmConfig = config;
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
            }, `fcm-${Date.now()}`);
        }
        catch (error) {
            throw new core_1.NotificationConfigurationException(`Failed to initialize Firebase Admin: ${error instanceof Error ? error.message : 'Unknown error'}`, {
                channel: 'FCM',
                error,
            });
        }
    }
    async sendPush(request) {
        try {
            const recipients = Array.isArray(request.to) ? request.to : [request.to];
            const deviceTokens = recipients.map((r) => r.deviceToken);
            if (deviceTokens.length === 0) {
                throw new core_1.NotificationConfigurationException('No device tokens provided', {
                    recipients,
                });
            }
            const message = {
                notification: {
                    title: request.title,
                    body: request.body,
                    imageUrl: request.imageUrl,
                },
            };
            if (request.icon || request.sound || request.badge) {
                message.android = {
                    priority: request.priority === 'urgent' || request.priority === 'high' ? 'high' : 'normal',
                    notification: {
                        icon: request.icon,
                        sound: request.sound,
                    },
                };
                if (request.sound || request.badge) {
                    message.apns = {
                        payload: {
                            aps: {
                                ...(request.sound && { sound: request.sound }),
                                ...(request.badge !== undefined && { badge: request.badge }),
                            },
                        },
                    };
                }
                message.webpush = {
                    notification: {
                        icon: request.icon,
                    },
                };
            }
            if (request.data) {
                message.data = Object.entries(request.data).reduce((acc, [key, value]) => {
                    acc[key] = String(value);
                    return acc;
                }, {});
            }
            if (request.actionUrl) {
                if (!message.data)
                    message.data = {};
                message.data.actionUrl = request.actionUrl;
            }
            let response;
            if (deviceTokens.length === 1) {
                const result = await admin.messaging(this.app).send({
                    token: deviceTokens[0],
                    ...message,
                });
                response = {
                    successCount: 1,
                    failureCount: 0,
                    responses: [
                        {
                            success: true,
                            messageId: result,
                        },
                    ],
                };
            }
            else {
                const result = await admin.messaging(this.app).sendEachForMulticast({
                    tokens: deviceTokens,
                    ...message,
                });
                response = {
                    successCount: result.successCount,
                    failureCount: result.failureCount,
                    responses: result.responses.map((r) => ({
                        success: r.success,
                        messageId: r.messageId,
                        error: r.error
                            ? {
                                code: r.error.code,
                                message: r.error.message,
                            }
                            : undefined,
                    })),
                };
            }
            const reference = request.reference || (0, core_1.generateReference)('PUSH');
            const messageId = response.responses[0]?.messageId || '';
            return {
                success: response.successCount > 0,
                messageId,
                reference,
                status: response.successCount > 0 ? core_1.NotificationStatus.SENT : core_1.NotificationStatus.FAILED,
                sentAt: new Date(),
                successCount: response.successCount,
                failureCount: response.failureCount,
                metadata: (0, core_1.sanitizeMetadata)(request.metadata),
                raw: response,
            };
        }
        catch (error) {
            return this.handleError(error, 'Failed to send push notification');
        }
    }
    handleError(error, defaultMessage) {
        if (error instanceof Error) {
            const fcmError = error;
            return {
                success: false,
                messageId: '',
                status: core_1.NotificationStatus.FAILED,
                successCount: 0,
                failureCount: 1,
                error: {
                    code: fcmError.code || 'FCM_ERROR',
                    message: error.message || defaultMessage,
                    details: error,
                },
            };
        }
        return {
            success: false,
            messageId: '',
            status: core_1.NotificationStatus.FAILED,
            successCount: 0,
            failureCount: 1,
            error: {
                code: 'UNKNOWN_ERROR',
                message: defaultMessage,
                details: error,
            },
        };
    }
    async destroy() {
        if (this.app) {
            await this.app.delete();
        }
    }
}
exports.FcmChannel = FcmChannel;
function createFcmChannel(config) {
    return new FcmChannel(config);
}
//# sourceMappingURL=fcm-channel.js.map