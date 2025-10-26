/**
 * Queue exception base class
 */
export class QueueException extends Error {
  constructor(
    message: string,
    public readonly code: string = 'QUEUE_ERROR',
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'QueueException';
    Object.setPrototypeOf(this, QueueException.prototype);
  }
}

/**
 * Job not found exception
 */
export class JobNotFoundException extends QueueException {
  constructor(jobId: string) {
    super(`Job with ID '${jobId}' not found`, 'JOB_NOT_FOUND', { jobId });
    this.name = 'JobNotFoundException';
    Object.setPrototypeOf(this, JobNotFoundException.prototype);
  }
}

/**
 * Queue configuration exception
 */
export class QueueConfigurationException extends QueueException {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'QUEUE_CONFIGURATION_ERROR', context);
    this.name = 'QueueConfigurationException';
    Object.setPrototypeOf(this, QueueConfigurationException.prototype);
  }
}

/**
 * Job execution exception
 */
export class JobExecutionException extends QueueException {
  constructor(
    message: string,
    public readonly jobId: string,
    public readonly originalError?: Error,
  ) {
    super(message, 'JOB_EXECUTION_ERROR', { jobId, originalError: originalError?.message });
    this.name = 'JobExecutionException';
    Object.setPrototypeOf(this, JobExecutionException.prototype);
  }
}
