"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
const types_1 = require("../types");
class Notification {
    constructor() {
        this.priority = types_1.NotificationPriority.NORMAL;
    }
    setPriority(priority) {
        this.priority = priority;
        return this;
    }
    setReference(reference) {
        this.reference = reference;
        return this;
    }
    setMetadata(metadata) {
        this.metadata = metadata;
        return this;
    }
}
exports.Notification = Notification;
//# sourceMappingURL=notification.js.map