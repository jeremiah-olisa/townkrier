/**
 * Notification log status
 */
export enum NotificationLogStatus {
  SCHEDULED = 'scheduled',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RETRYING = 'retrying',
}

/**
 * Content privacy level
 */
export enum ContentPrivacy {
  PUBLIC = 'public',
  PRIVATE = 'private',
  MASKED = 'masked',
}
