"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushChannel = void 0;
const base_notification_channel_1 = require("../core/base-notification-channel");
const types_1 = require("../types");
class PushChannel extends base_notification_channel_1.BaseNotificationChannel {
    constructor(config, channelName) {
        super(config, channelName, types_1.NotificationChannel.PUSH);
    }
    async send(notification) {
        return this.sendPush(notification);
    }
}
exports.PushChannel = PushChannel;
//# sourceMappingURL=push-channel.js.map