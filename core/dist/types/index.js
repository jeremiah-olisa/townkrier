"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationPriority = exports.NotificationStatus = exports.NotificationChannel = void 0;
var NotificationChannel;
(function (NotificationChannel) {
    NotificationChannel["EMAIL"] = "email";
    NotificationChannel["SMS"] = "sms";
    NotificationChannel["PUSH"] = "push";
    NotificationChannel["IN_APP"] = "in_app";
    NotificationChannel["SLACK"] = "slack";
    NotificationChannel["DATABASE"] = "database";
})(NotificationChannel || (exports.NotificationChannel = NotificationChannel = {}));
var NotificationStatus;
(function (NotificationStatus) {
    NotificationStatus["PENDING"] = "pending";
    NotificationStatus["SENT"] = "sent";
    NotificationStatus["DELIVERED"] = "delivered";
    NotificationStatus["FAILED"] = "failed";
    NotificationStatus["READ"] = "read";
})(NotificationStatus || (exports.NotificationStatus = NotificationStatus = {}));
var NotificationPriority;
(function (NotificationPriority) {
    NotificationPriority["LOW"] = "low";
    NotificationPriority["NORMAL"] = "normal";
    NotificationPriority["HIGH"] = "high";
    NotificationPriority["URGENT"] = "urgent";
})(NotificationPriority || (exports.NotificationPriority = NotificationPriority = {}));
//# sourceMappingURL=index.js.map