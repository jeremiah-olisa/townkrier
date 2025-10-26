"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TermiiChannel = void 0;
exports.createTermiiChannel = createTermiiChannel;
const axios_1 = __importDefault(require("axios"));
const core_1 = require("@townkrier/core");
class TermiiChannel extends core_1.SmsChannel {
    constructor(config) {
        if (!config.apiKey) {
            throw new core_1.NotificationConfigurationException('API key is required for Termii', {
                channel: 'Termii',
            });
        }
        super(config, 'Termii');
        this.termiiConfig = config;
        this.baseUrl = config.baseUrl || 'https://api.ng.termii.com';
        this.client = axios_1.default.create({
            baseURL: this.baseUrl,
            timeout: config.timeout || 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (config.debug) {
            this.client.interceptors.request.use((request) => {
                console.log('[Termii Request]', {
                    url: request.url,
                    method: request.method,
                    data: request.data,
                });
                return request;
            });
            this.client.interceptors.response.use((response) => {
                console.log('[Termii Response]', {
                    status: response.status,
                    data: response.data,
                });
                return response;
            }, (error) => {
                console.error('[Termii Error]', {
                    message: error.message,
                    response: error.response?.data,
                });
                return Promise.reject(error);
            });
        }
    }
    async sendSms(request) {
        try {
            const recipients = Array.isArray(request.to) ? request.to : [request.to];
            const validRecipients = recipients.filter((r) => {
                if (!(0, core_1.isValidPhone)(r.phone)) {
                    console.warn(`Invalid phone number skipped: ${r.phone}`);
                    return false;
                }
                return true;
            });
            if (validRecipients.length === 0) {
                throw new core_1.NotificationConfigurationException('No valid phone numbers provided', {
                    recipients,
                });
            }
            const recipient = validRecipients[0];
            const normalizedPhone = (0, core_1.normalizePhone)(recipient.phone);
            const from = request.from || this.termiiConfig.senderId || 'Townkrier';
            const channel = this.termiiConfig.channel || 'generic';
            const smsData = {
                api_key: this.termiiConfig.apiKey,
                to: normalizedPhone,
                from,
                sms: request.text,
                type: 'plain',
                channel,
            };
            const response = await this.client.post('/api/sms/send', smsData);
            if (!response.data || !response.data.message_id) {
                throw new core_1.NotificationInvalidResponseError(response.data?.message || 'No response data from Termii', response.status, response.data);
            }
            const data = response.data;
            const reference = request.reference || (0, core_1.generateReference)('SMS');
            return {
                success: true,
                messageId: data.message_id,
                reference,
                status: core_1.NotificationStatus.SENT,
                sentAt: new Date(),
                units: 1,
                metadata: (0, core_1.sanitizeMetadata)(request.metadata),
                raw: response.data,
            };
        }
        catch (error) {
            return this.handleError(error, 'Failed to send SMS');
        }
    }
    handleError(error, defaultMessage) {
        if (axios_1.default.isAxiosError(error)) {
            const axiosError = error;
            const message = axiosError.response?.data?.message || axiosError.message || defaultMessage;
            const statusCode = axiosError.response?.status;
            if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
                return {
                    success: false,
                    messageId: '',
                    status: core_1.NotificationStatus.FAILED,
                    error: {
                        code: 'TERMII_TIMEOUT',
                        message: 'Termii API request timed out',
                        details: {
                            statusCode,
                            response: axiosError.response?.data,
                        },
                    },
                };
            }
            return {
                success: false,
                messageId: '',
                status: core_1.NotificationStatus.FAILED,
                error: {
                    code: 'TERMII_ERROR',
                    message,
                    details: {
                        statusCode,
                        response: axiosError.response?.data,
                    },
                },
            };
        }
        if (error instanceof Error && error.name && error.name.includes('Exception')) {
            const notificationError = error;
            return {
                success: false,
                messageId: '',
                status: core_1.NotificationStatus.FAILED,
                error: {
                    code: notificationError.code || 'NOTIFICATION_ERROR',
                    message: error.message || defaultMessage,
                    details: notificationError.details,
                },
            };
        }
        return {
            success: false,
            messageId: '',
            status: core_1.NotificationStatus.FAILED,
            error: {
                code: 'UNKNOWN_ERROR',
                message: error instanceof Error ? error.message : defaultMessage,
                details: error,
            },
        };
    }
}
exports.TermiiChannel = TermiiChannel;
function createTermiiChannel(config) {
    return new TermiiChannel(config);
}
//# sourceMappingURL=termii-channel.js.map