"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlackChannel = void 0;
const types_1 = require("../types");
class SlackChannel {
    constructor(config, channelName) {
        this.config = config;
        this.channelName = channelName;
        this.channelType = types_1.NotificationChannel.SLACK;
    }
    async send(notification) {
        const slackRequest = {
            text: notification.message || notification.text || notification.body || '',
        };
        const result = await this.sendSlack(slackRequest);
        return {
            success: result.success,
            messageId: result.ts || '',
            status: result.success ? 'sent' : 'failed',
            raw: result.raw,
        };
    }
    getChannelName() {
        return this.channelName;
    }
    getChannelType() {
        return this.channelType;
    }
    isReady() {
        return !!(this.config.apiKey || this.config.secretKey);
    }
}
exports.SlackChannel = SlackChannel;
//# sourceMappingURL=slack-channel.js.map