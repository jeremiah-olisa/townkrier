import { Notification, NotificationRecipient } from 'townkrier-core';
import { IQueueAdapter, QueueAdapterConfig, QueueJob, QueueJobConfig } from '../interfaces';
import { JobStatus, JobPriority } from '../types';
import { JobNotFoundException } from '../exceptions';
import { randomUUID } from 'crypto';

/**
 * In-memory queue adapter implementation with retry logic
 * Similar to Hangfire's in-memory storage
 */
export class InMemoryQueueAdapter implements IQueueAdapter {
  private jobs: Map<string, QueueJob> = new Map();
  private queue: string[] = []; // Job IDs sorted by priority and scheduled time
  private config: Required<QueueAdapterConfig>;

  constructor(config: QueueAdapterConfig = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      timeout: config.timeout ?? 30000,
      pollInterval: config.pollInterval ?? 1000,
    };
  }

  /**
   * Add a job to the queue
   */
  async enqueue(
    notification: Notification,
    recipient: NotificationRecipient,
    config?: QueueJobConfig,
  ): Promise<QueueJob> {
    const jobId = randomUUID();
    const now = new Date();

    const job: QueueJob = {
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

    this.jobs.set(jobId, job);
    this.addToQueue(jobId);

    return job;
  }

  /**
   * Get a job by ID
   */
  async getJob(jobId: string): Promise<QueueJob | null> {
    return this.jobs.get(jobId) || null;
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
    let jobs = Array.from(this.jobs.values());

    // Apply filters
    if (filters?.status) {
      jobs = jobs.filter((job) => job.status === filters.status);
    }
    if (filters?.priority) {
      jobs = jobs.filter((job) => job.priority === filters.priority);
    }

    // Sort by priority (desc) and created date (asc)
    jobs.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    // Apply pagination
    const offset = filters?.offset ?? 0;
    const limit = filters?.limit ?? jobs.length;
    return jobs.slice(offset, offset + limit);
  }

  /**
   * Process the next job in the queue
   */
  async processNext(): Promise<QueueJob | null> {
    const now = new Date();

    // Find the next eligible job
    for (let i = 0; i < this.queue.length; i++) {
      const jobId = this.queue[i];
      const job = this.jobs.get(jobId);

      if (!job) {
        // Clean up invalid job ID
        this.queue.splice(i, 1);
        i--;
        continue;
      }

      // Check if job is ready to process
      if (job.status === JobStatus.PENDING || job.status === JobStatus.RETRYING) {
        // Check if scheduled time has passed
        if (job.scheduledFor && job.scheduledFor > now) {
          continue;
        }

        // Mark as processing
        job.status = JobStatus.PROCESSING;
        job.updatedAt = now;
        job.processedAt = now;
        job.attempts++;

        job.logs.push({
          timestamp: now,
          attempt: job.attempts,
          status: JobStatus.PROCESSING,
          message: `Processing attempt ${job.attempts}`,
        });

        // Remove from queue temporarily (will be re-added if it fails and needs retry)
        this.queue.splice(i, 1);

        return job;
      }
    }

    return null;
  }

  /**
   * Mark a job as completed
   */
  async markCompleted(jobId: string, result?: unknown): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new JobNotFoundException(jobId);
    }

    const now = new Date();
    job.status = JobStatus.COMPLETED;
    job.updatedAt = now;
    job.completedAt = now;
    job.result = result;

    const duration = job.processedAt ? now.getTime() - job.processedAt.getTime() : undefined;

    job.logs.push({
      timestamp: now,
      attempt: job.attempts,
      status: JobStatus.COMPLETED,
      message: `Job completed successfully`,
      duration,
    });
  }

  /**
   * Mark a job as failed
   */
  async markFailed(jobId: string, error: Error): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new JobNotFoundException(jobId);
    }

    const now = new Date();
    job.updatedAt = now;
    job.error = error.message;

    const duration = job.processedAt ? now.getTime() - job.processedAt.getTime() : undefined;

    // Check if we should retry
    if (job.attempts < job.maxRetries) {
      job.status = JobStatus.RETRYING;

      // Calculate next retry time with exponential backoff
      const retryDelay = this.config.retryDelay * Math.pow(2, job.attempts - 1);
      job.scheduledFor = new Date(now.getTime() + retryDelay);

      job.logs.push({
        timestamp: now,
        attempt: job.attempts,
        status: JobStatus.RETRYING,
        message: `Job failed, retrying in ${retryDelay}ms`,
        error: error.message,
        duration,
      });

      // Re-add to queue for retry
      this.addToQueue(jobId);
    } else {
      job.status = JobStatus.FAILED;
      job.failedAt = now;

      job.logs.push({
        timestamp: now,
        attempt: job.attempts,
        status: JobStatus.FAILED,
        message: `Job failed after ${job.attempts} attempts`,
        error: error.message,
        duration,
      });
    }
  }

  /**
   * Retry a failed job
   */
  async retry(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new JobNotFoundException(jobId);
    }

    const now = new Date();
    job.status = JobStatus.PENDING;
    job.updatedAt = now;
    job.attempts = 0; // Reset attempts for manual retry
    job.error = undefined;
    job.scheduledFor = undefined;

    job.logs.push({
      timestamp: now,
      attempt: 0,
      status: JobStatus.PENDING,
      message: 'Job manually retried',
    });

    this.addToQueue(jobId);
  }

  /**
   * Delete a job
   */
  async deleteJob(jobId: string): Promise<void> {
    this.jobs.delete(jobId);
    const index = this.queue.indexOf(jobId);
    if (index > -1) {
      this.queue.splice(index, 1);
    }
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
    const jobs = Array.from(this.jobs.values());

    return {
      pending: jobs.filter((j) => j.status === JobStatus.PENDING).length,
      processing: jobs.filter((j) => j.status === JobStatus.PROCESSING).length,
      completed: jobs.filter((j) => j.status === JobStatus.COMPLETED).length,
      failed: jobs.filter((j) => j.status === JobStatus.FAILED).length,
      retrying: jobs.filter((j) => j.status === JobStatus.RETRYING).length,
      scheduled: jobs.filter((j) => j.status === JobStatus.SCHEDULED).length,
    };
  }

  /**
   * Clear all jobs (for testing)
   */
  async clear(): Promise<void> {
    this.jobs.clear();
    this.queue = [];
  }

  /**
   * Add a job to the queue in priority order
   */
  private addToQueue(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    // Remove if already in queue
    const existingIndex = this.queue.indexOf(jobId);
    if (existingIndex > -1) {
      this.queue.splice(existingIndex, 1);
    }

    // Find the right position based on priority and scheduled time
    let insertIndex = 0;
    for (let i = 0; i < this.queue.length; i++) {
      const otherJob = this.jobs.get(this.queue[i]);
      if (!otherJob) continue;

      // Higher priority jobs go first
      if (job.priority > otherJob.priority) {
        break;
      }

      // Same priority, earlier scheduled time goes first
      if (job.priority === otherJob.priority) {
        const jobTime = job.scheduledFor?.getTime() ?? job.createdAt.getTime();
        const otherTime = otherJob.scheduledFor?.getTime() ?? otherJob.createdAt.getTime();
        if (jobTime < otherTime) {
          break;
        }
      }

      insertIndex = i + 1;
    }

    this.queue.splice(insertIndex, 0, jobId);
  }
}
