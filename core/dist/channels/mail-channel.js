"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailChannel = void 0;
const base_notification_channel_1 = require("../core/base-notification-channel");
const types_1 = require("../types");
class MailChannel extends base_notification_channel_1.BaseNotificationChannel {
    constructor(config, channelName) {
        super(config, channelName, types_1.NotificationChannel.EMAIL);
    }
    async send(notification) {
        return this.sendEmail(notification);
    }
}
exports.MailChannel = MailChannel;
//# sourceMappingURL=mail-channel.js.map