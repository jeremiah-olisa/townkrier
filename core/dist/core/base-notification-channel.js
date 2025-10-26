"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseNotificationChannel = void 0;
const exceptions_1 = require("../exceptions");
class BaseNotificationChannel {
    constructor(config, channelName, channelType) {
        this.config = config;
        this.channelName = channelName;
        this.channelType = channelType;
        this.validateConfig();
    }
    validateConfig() {
        if (!this.config.apiKey && !this.config.secretKey) {
            throw new exceptions_1.NotificationConfigurationException(`${this.channelName}: API key or secret key is required`, {
                channelName: this.channelName,
            });
        }
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
exports.BaseNotificationChannel = BaseNotificationChannel;
//# sourceMappingURL=base-notification-channel.js.map