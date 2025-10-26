/**
 * Storage exception base class
 */
export class StorageException extends Error {
  constructor(
    message: string,
    public readonly code: string = 'STORAGE_ERROR',
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'StorageException';
    Object.setPrototypeOf(this, StorageException.prototype);
  }
}

/**
 * Log not found exception
 */
export class LogNotFoundException extends StorageException {
  constructor(logId: string) {
    super(`Notification log with ID '${logId}' not found`, 'LOG_NOT_FOUND', { logId });
    this.name = 'LogNotFoundException';
    Object.setPrototypeOf(this, LogNotFoundException.prototype);
  }
}
