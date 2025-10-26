import {
  Notification,
  NotificationChannel,
  NotificationManager,
  NotificationRecipient,
} from '@townkrier/core';
import { IQueueAdapter, QueueJobConfig, QueueJob } from '../interfaces';
import { JobStatus } from '../types';
import { JobExecutionException } from '../exceptions';

/**
 * Queue Manager for background notification processing
 * Similar to Laravel's queue system with Hangfire-like retry logic
 */
export class QueueManager {
  private adapter: IQueueAdapter;
  private notificationManager?: NotificationManager;
  private isProcessing: boolean = false;
  private processingInterval?: NodeJS.Timeout;

  constructor(adapter: IQueueAdapter, notificationManager?: NotificationManager) {
    this.adapter = adapter;
    this.notificationManager = notificationManager;
  }

  /**
   * Set the notification manager for processing jobs
   */
  setNotificationManager(manager: NotificationManager): this {
    this.notificationManager = manager;
    return this;
  }

  /**
   * Add a notification to the queue (background processing)
   * Similar to Laravel's Queue::push() or queue->send()
   */
  async enqueue(
    notification: Notification,
    recipient: NotificationRecipient,
    config?: QueueJobConfig,
  ): Promise<QueueJob> {
    return this.adapter.enqueue(notification, recipient, config);
  }

  /**
   * Send a notification immediately (async but not queued)
   * Similar to Laravel's sendNow()
   */
  async sendNow(
    notification: Notification,
    recipient: NotificationRecipient,
  ): Promise<Map<NotificationChannel, unknown>> {
    if (!this.notificationManager) {
      throw new JobExecutionException(
        'NotificationManager not set. Cannot send notification immediately.',
        'sendNow',
      );
    }

    return this.notificationManager.send(notification, recipient);
  }

  /**
   * Get a job by ID
   */
  async getJob(jobId: string): Promise<QueueJob | null> {
    return this.adapter.getJob(jobId);
  }

  /**
   * Get all jobs with optional filters
   */
  async getJobs(filters?: {
    status?: JobStatus;
    limit?: number;
    offset?: number;
  }): Promise<QueueJob[]> {
    return this.adapter.getJobs(filters);
  }

  /**
   * Retry a failed job
   */
  async retryJob(jobId: string): Promise<void> {
    return this.adapter.retry(jobId);
  }

  /**
   * Delete a job
   */
  async deleteJob(jobId: string): Promise<void> {
    return this.adapter.deleteJob(jobId);
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    retrying: number;
    scheduled: number;
  }> {
    return this.adapter.getStats();
  }

  /**
   * Start processing jobs from the queue
   * @param options.pollInterval - Interval in ms to check for new jobs
   * @param options.concurrency - Number of jobs to process concurrently (future enhancement)
   */
  startProcessing(options: { pollInterval?: number; concurrency?: number } = {}): void {
    if (this.isProcessing) {
      console.warn('Queue processing is already running');
      return;
    }

    if (!this.notificationManager) {
      throw new JobExecutionException(
        'NotificationManager not set. Cannot start processing.',
        'startProcessing',
      );
    }

    this.isProcessing = true;
    const pollInterval = options.pollInterval ?? 1000;

    console.log(`Starting queue processing with ${pollInterval}ms poll interval`);

    // Check if adapter has a startWorker method (BullMQ adapter)
    if ('startWorker' in this.adapter && typeof this.adapter.startWorker === 'function') {
      // Set processing callback for BullMQ adapter
      if (
        'setProcessingCallback' in this.adapter &&
        typeof this.adapter.setProcessingCallback === 'function'
      ) {
        this.adapter.setProcessingCallback(async (job: QueueJob) => {
          try {
            const result = await this.notificationManager!.send(job.notification, job.recipient);
            await this.adapter.markCompleted(job.id, result);
          } catch (error) {
            await this.adapter.markFailed(
              job.id,
              error instanceof Error ? error : new Error(String(error)),
            );
          }
        });
      }
      // Start BullMQ worker
      this.adapter.startWorker();
    } else {
      // Use polling for in-memory adapter
      this.processingInterval = setInterval(async () => {
        await this.processNextJob();
      }, pollInterval);

      // Process first job immediately
      this.processNextJob().catch((error) => {
        console.error('Error processing first job:', error);
      });
    }
  }

  /**
   * Stop processing jobs from the queue
   */
  async stopProcessing(): Promise<void> {
    if (!this.isProcessing) {
      console.warn('Queue processing is not running');
      return;
    }

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }

    // Check if adapter has a stopWorker method (BullMQ adapter)
    if ('stopWorker' in this.adapter && typeof this.adapter.stopWorker === 'function') {
      await this.adapter.stopWorker();
    }

    this.isProcessing = false;
    console.log('Queue processing stopped');
  }

  /**
   * Process the next job in the queue
   */
  private async processNextJob(): Promise<void> {
    if (!this.notificationManager) {
      return;
    }

    try {
      const job = await this.adapter.processNext();
      if (!job) {
        return; // No jobs to process
      }

      try {
        // Send the notification
        const result = await this.notificationManager.send(job.notification, job.recipient);

        // Mark as completed
        await this.adapter.markCompleted(job.id, result);
      } catch (error) {
        // Mark as failed (adapter will handle retry logic)
        await this.adapter.markFailed(
          job.id,
          error instanceof Error ? error : new Error(String(error)),
        );
      }
    } catch (error) {
      console.error('Error processing job:', error);
    }
  }

  /**
   * Get the underlying adapter
   */
  getAdapter(): IQueueAdapter {
    return this.adapter;
  }
}
