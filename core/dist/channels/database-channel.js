"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseChannel = void 0;
const base_notification_channel_1 = require("../core/base-notification-channel");
const types_1 = require("../types");
class DatabaseChannel extends base_notification_channel_1.BaseNotificationChannel {
    constructor(config, channelName) {
        super(config, channelName, types_1.NotificationChannel.IN_APP);
    }
    async send(notification) {
        return this.sendInApp(notification);
    }
}
exports.DatabaseChannel = DatabaseChannel;
//# sourceMappingURL=database-channel.js.map