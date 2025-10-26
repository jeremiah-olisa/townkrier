import { Notification, NotificationChannel } from '@townkrier/core';
import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import { IQueueAdapter, QueueAdapterConfig, QueueJob, QueueJobConfig, JobLog } from '../interfaces';
import { JobStatus, JobPriority } from '../types';
import { JobNotFoundException } from '../exceptions';
import { randomUUID } from 'crypto';

/**
 * BullMQ queue adapter configuration
 */
export interface BullMQQueueAdapterConfig extends QueueAdapterConfig {
  redis?: {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
    maxRetriesPerRequest?: null;
  };
  queueName?: string;
}

/**
 * BullMQ queue adapter implementation with Redis storage
 * Provides persistent queue with retry logic similar to Hangfire
 */
export class BullMQQueueAdapter implements IQueueAdapter {
  private queue: Queue;
  private worker?: Worker;
  private queueEvents: QueueEvents;
  private config: Required<QueueAdapterConfig> & {
    redis: BullMQQueueAdapterConfig['redis'];
    queueName: string;
  };
  private connection: Redis;
  private jobMetadata: Map<
    string,
    { notification: Notification; recipient: Record<NotificationChannel, unknown> }
  > = new Map();
  private processingCallback?: (job: QueueJob) => Promise<void>;

  constructor(config: BullMQQueueAdapterConfig = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      timeout: config.timeout ?? 30000,
      pollInterval: config.pollInterval ?? 1000,
      redis: config.redis ?? { host: 'localhost', port: 6379, maxRetriesPerRequest: null },
      queueName: config.queueName ?? 'townkrier-notifications',
    };

    // Create Redis connection
    this.connection = new Redis(
      this.config.redis || { host: 'localhost', port: 6379, maxRetriesPerRequest: null },
    );

    // Create BullMQ queue
    this.queue = new Queue(this.config.queueName, {
      connection: this.connection,
    });

    // Create queue events for monitoring
    this.queueEvents = new QueueEvents(this.config.queueName, {
      connection: this.connection.duplicate(),
    });
  }

  /**
   * Set the processing callback for jobs
   */
  setProcessingCallback(callback: (job: QueueJob) => Promise<void>): void {
    this.processingCallback = callback;
  }

  /**
   * Start the worker to process jobs
   */
  startWorker(): void {
    if (this.worker) {
      return;
    }

    this.worker = new Worker(
      this.config.queueName,
      async (job: Job) => {
        const queueJob = await this.getJob(job.id!);
        if (queueJob && this.processingCallback) {
          await this.processingCallback(queueJob);
        }
        return queueJob;
      },
      {
        connection: this.connection.duplicate(),
        concurrency: 1,
      },
    );
  }

  /**
   * Stop the worker
   */
  async stopWorker(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = undefined;
    }
  }

  /**
   * Add a job to the queue
   */
  async enqueue(
    notification: Notification,
    recipient: Record<NotificationChannel, unknown>,
    config?: QueueJobConfig,
  ): Promise<QueueJob> {
    const jobId = randomUUID();
    const now = new Date();

    // Store notification and recipient metadata
    this.jobMetadata.set(jobId, { notification, recipient });

    // Calculate delay for scheduled jobs
    let delay = 0;
    if (config?.scheduledFor && config.scheduledFor > now) {
      delay = config.scheduledFor.getTime() - now.getTime();
    }

    // Add job to BullMQ queue
    await this.queue.add(
      'notification',
      {
        jobId,
        notificationName: notification.constructor.name,
        recipientInfo: JSON.stringify(recipient),
        metadata: config?.metadata,
      },
      {
        jobId,
        priority: this.mapPriorityToBullMQ(config?.priority ?? JobPriority.NORMAL),
        attempts: (config?.maxRetries ?? this.config.maxRetries) + 1,
        backoff: {
          type: 'exponential',
          delay: config?.retryDelay ?? this.config.retryDelay,
        },
        delay,
      },
    );

    const queueJob: QueueJob = {
      id: jobId,
      notification,
      recipient,
      status:
        config?.scheduledFor && config.scheduledFor > now ? JobStatus.SCHEDULED : JobStatus.PENDING,
      priority: config?.priority ?? JobPriority.NORMAL,
      attempts: 0,
      maxRetries: config?.maxRetries ?? this.config.maxRetries,
      scheduledFor: config?.scheduledFor,
      createdAt: now,
      updatedAt: now,
      metadata: config?.metadata,
      logs: [
        {
          timestamp: now,
          attempt: 0,
          status: JobStatus.PENDING,
          message: 'Job created',
        },
      ],
    };

    return queueJob;
  }

  /**
   * Get a job by ID
   */
  async getJob(jobId: string): Promise<QueueJob | null> {
    const bullJob = await this.queue.getJob(jobId);
    if (!bullJob) {
      return null;
    }

    return this.bullJobToQueueJob(bullJob);
  }

  /**
   * Get all jobs with optional filters
   */
  async getJobs(filters?: {
    status?: JobStatus;
    priority?: JobPriority;
    limit?: number;
    offset?: number;
  }): Promise<QueueJob[]> {
    const limit = filters?.limit ?? 100;
    const offset = filters?.offset ?? 0;

    let bullJobs: Job[] = [];

    // Get jobs based on status filter
    if (filters?.status) {
      const statusMap: Record<JobStatus, string[]> = {
        [JobStatus.PENDING]: ['waiting', 'delayed'],
        [JobStatus.PROCESSING]: ['active'],
        [JobStatus.COMPLETED]: ['completed'],
        [JobStatus.FAILED]: ['failed'],
        [JobStatus.RETRYING]: ['waiting'],
        [JobStatus.SCHEDULED]: ['delayed'],
      };

      const bullStatuses = statusMap[filters.status] || [];
      for (const status of bullStatuses) {
        const jobs = await this.queue.getJobs(status as any, offset, offset + limit - 1);
        bullJobs.push(...jobs);
      }
    } else {
      // Get all jobs
      const waiting = await this.queue.getWaiting(offset, offset + limit - 1);
      const active = await this.queue.getActive(offset, offset + limit - 1);
      const completed = await this.queue.getCompleted(offset, offset + limit - 1);
      const failed = await this.queue.getFailed(offset, offset + limit - 1);
      const delayed = await this.queue.getDelayed(offset, offset + limit - 1);

      bullJobs = [...waiting, ...active, ...completed, ...failed, ...delayed];
    }

    const queueJobs = await Promise.all(bullJobs.map((bullJob) => this.bullJobToQueueJob(bullJob)));

    // Filter out nulls and apply additional filters
    let filteredJobs = queueJobs.filter((job): job is QueueJob => job !== null);

    if (filters?.priority !== undefined) {
      filteredJobs = filteredJobs.filter((job) => job.priority === filters.priority);
    }

    // Sort by priority and created date
    filteredJobs.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    return filteredJobs.slice(0, limit);
  }

  /**
   * Process the next job in the queue (not needed with Worker, but required by interface)
   */
  async processNext(): Promise<QueueJob | null> {
    // With BullMQ, processing is handled by the Worker
    // This method is kept for interface compatibility
    return null;
  }

  /**
   * Mark a job as completed
   */
  async markCompleted(jobId: string, result?: unknown): Promise<void> {
    const bullJob = await this.queue.getJob(jobId);
    if (!bullJob) {
      throw new JobNotFoundException(jobId);
    }

    await bullJob.moveToCompleted(result, bullJob.token || '0', false);
  }

  /**
   * Mark a job as failed
   */
  async markFailed(jobId: string, error: Error): Promise<void> {
    const bullJob = await this.queue.getJob(jobId);
    if (!bullJob) {
      throw new JobNotFoundException(jobId);
    }

    await bullJob.moveToFailed(error, bullJob.token || '0', false);
  }

  /**
   * Retry a failed job
   */
  async retry(jobId: string): Promise<void> {
    const bullJob = await this.queue.getJob(jobId);
    if (!bullJob) {
      throw new JobNotFoundException(jobId);
    }

    await bullJob.retry();
  }

  /**
   * Delete a job
   */
  async deleteJob(jobId: string): Promise<void> {
    const bullJob = await this.queue.getJob(jobId);
    if (bullJob) {
      await bullJob.remove();
    }
    this.jobMetadata.delete(jobId);
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
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    return {
      pending: waiting,
      processing: active,
      completed,
      failed,
      retrying: 0, // BullMQ doesn't have a separate retrying state
      scheduled: delayed,
    };
  }

  /**
   * Clear all jobs (for testing)
   */
  async clear(): Promise<void> {
    await this.queue.obliterate({ force: true });
    this.jobMetadata.clear();
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    await this.stopWorker();
    await this.queue.close();
    await this.queueEvents.close();
    await this.connection.quit();
  }

  /**
   * Convert BullMQ job to QueueJob
   */
  private async bullJobToQueueJob(bullJob: Job): Promise<QueueJob | null> {
    const jobId = bullJob.id!;
    const metadata = this.jobMetadata.get(jobId);

    if (!metadata) {
      // Cannot fully reconstruct without the notification instance
      // Return null
      return null;
    }

    const state = await bullJob.getState();

    const queueJob: QueueJob = {
      id: jobId,
      notification: metadata.notification,
      recipient: metadata.recipient,
      status: this.mapBullMQStateToJobStatus(state),
      priority: this.mapBullMQPriorityToInternal(bullJob.opts.priority || 0),
      attempts: bullJob.attemptsMade,
      maxRetries: (bullJob.opts.attempts || 1) - 1,
      scheduledFor: bullJob.opts.delay
        ? new Date(bullJob.timestamp + bullJob.opts.delay)
        : undefined,
      createdAt: new Date(bullJob.timestamp),
      updatedAt: new Date(bullJob.processedOn || bullJob.timestamp),
      processedAt: bullJob.processedOn ? new Date(bullJob.processedOn) : undefined,
      completedAt: bullJob.finishedOn ? new Date(bullJob.finishedOn) : undefined,
      failedAt: state === 'failed' && bullJob.finishedOn ? new Date(bullJob.finishedOn) : undefined,
      error: bullJob.failedReason,
      result: bullJob.returnvalue,
      metadata: bullJob.data.metadata,
      logs: await this.buildJobLogs(bullJob),
    };

    return queueJob;
  }

  /**
   * Build job logs from BullMQ job
   */
  private async buildJobLogs(bullJob: Job): Promise<JobLog[]> {
    const logs: JobLog[] = [
      {
        timestamp: new Date(bullJob.timestamp),
        attempt: 0,
        status: JobStatus.PENDING,
        message: 'Job created',
      },
    ];

    if (bullJob.processedOn) {
      logs.push({
        timestamp: new Date(bullJob.processedOn),
        attempt: bullJob.attemptsMade,
        status: JobStatus.PROCESSING,
        message: `Processing attempt ${bullJob.attemptsMade}`,
      });
    }

    if (bullJob.finishedOn) {
      const isFailed = await bullJob.isFailed();
      const state = isFailed ? JobStatus.FAILED : JobStatus.COMPLETED;
      logs.push({
        timestamp: new Date(bullJob.finishedOn),
        attempt: bullJob.attemptsMade,
        status: state,
        message: isFailed ? `Job failed: ${bullJob.failedReason}` : 'Job completed',
        error: bullJob.failedReason,
      });
    }

    return logs;
  }

  /**
   * Map internal priority to BullMQ priority (lower number = higher priority in BullMQ)
   */
  private mapPriorityToBullMQ(priority: JobPriority): number {
    // Invert the priority: higher internal priority = lower BullMQ number
    return 100 - priority;
  }

  /**
   * Map BullMQ priority to internal priority
   */
  private mapBullMQPriorityToInternal(bullPriority: number): JobPriority {
    const priority = 100 - bullPriority;
    if (priority >= 20) return JobPriority.CRITICAL;
    if (priority >= 10) return JobPriority.HIGH;
    if (priority >= 5) return JobPriority.NORMAL;
    return JobPriority.LOW;
  }

  /**
   * Map BullMQ state to JobStatus
   */
  private mapBullMQStateToJobStatus(state: string): JobStatus {
    switch (state) {
      case 'waiting':
        return JobStatus.PENDING;
      case 'active':
        return JobStatus.PROCESSING;
      case 'completed':
        return JobStatus.COMPLETED;
      case 'failed':
        return JobStatus.FAILED;
      case 'delayed':
        return JobStatus.SCHEDULED;
      default:
        return JobStatus.PENDING;
    }
  }
}
