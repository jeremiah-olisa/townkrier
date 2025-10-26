"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsChannel = void 0;
const base_notification_channel_1 = require("../core/base-notification-channel");
const types_1 = require("../types");
class SmsChannel extends base_notification_channel_1.BaseNotificationChannel {
    constructor(config, channelName) {
        super(config, channelName, types_1.NotificationChannel.SMS);
    }
    async send(notification) {
        return this.sendSms(notification);
    }
}
exports.SmsChannel = SmsChannel;
//# sourceMappingURL=sms-channel.js.map