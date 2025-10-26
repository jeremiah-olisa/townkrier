"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReference = generateReference;
exports.sanitizeMetadata = sanitizeMetadata;
exports.isValidEmail = isValidEmail;
exports.isValidPhone = isValidPhone;
exports.normalizePhone = normalizePhone;
exports.formatName = formatName;
exports.truncateText = truncateText;
function generateReference(prefix = 'NOTIF') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}
function sanitizeMetadata(metadata) {
    if (!metadata)
        return undefined;
    return Object.entries(metadata).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
            acc[key] = value;
        }
        return acc;
    }, {});
}
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
function isValidPhone(phone) {
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}
function normalizePhone(phone) {
    return phone.replace(/[^\d+]/g, '');
}
function formatName(firstName, lastName) {
    if (!firstName && !lastName)
        return undefined;
    return [firstName, lastName].filter(Boolean).join(' ');
}
function truncateText(text, maxLength, ellipsis = '...') {
    if (text.length <= maxLength)
        return text;
    return text.substring(0, maxLength - ellipsis.length) + ellipsis;
}
//# sourceMappingURL=index.js.map