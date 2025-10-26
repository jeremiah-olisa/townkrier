import { Notification, NotificationChannel } from '@townkrier/core';
import { JobStatus, JobPriority } from '../types';

/**
 * Queue job configuration
 */
export interface QueueJobConfig {
  maxRetries?: number;
  retryDelay?: number; // milliseconds
  timeout?: number; // milliseconds
  priority?: JobPriority;
  scheduledFor?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Queue job data structure
 */
export interface QueueJob<T = unknown> {
  id: string;
  notification: Notification;
  recipient: Record<NotificationChannel, unknown>;
  status: JobStatus;
  priority: JobPriority;
  attempts: number;
  maxRetries: number;
  scheduledFor?: Date;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  error?: string;
  result?: T;
  metadata?: Record<string, unknown>;
  logs: JobLog[];
}

/**
 * Job execution log entry
 */
export interface JobLog {
  timestamp: Date;
  attempt: number;
  status: JobStatus;
  message: string;
  error?: string;
  duration?: number; // milliseconds
}

/**
 * Queue adapter interface
 */
export interface IQueueAdapter {
  /**
   * Add a job to the queue
   */
  enqueue(
    notification: Notification,
    recipient: Record<NotificationChannel, unknown>,
    config?: QueueJobConfig,
  ): Promise<QueueJob>;

  /**
   * Get a job by ID
   */
  getJob(jobId: string): Promise<QueueJob | null>;

  /**
   * Get all jobs with optional filters
   */
  getJobs(filters?: {
    status?: JobStatus;
    priority?: JobPriority;
    limit?: number;
    offset?: number;
  }): Promise<QueueJob[]>;

  /**
   * Process the next job in the queue
   */
  processNext(): Promise<QueueJob | null>;

  /**
   * Mark a job as completed
   */
  markCompleted(jobId: string, result?: unknown): Promise<void>;

  /**
   * Mark a job as failed
   */
  markFailed(jobId: string, error: Error): Promise<void>;

  /**
   * Retry a failed job
   */
  retry(jobId: string): Promise<void>;

  /**
   * Delete a job
   */
  deleteJob(jobId: string): Promise<void>;

  /**
   * Get queue statistics
   */
  getStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    retrying: number;
    scheduled: number;
  }>;

  /**
   * Clear all jobs (optional, for testing)
   */
  clear?(): Promise<void>;
}

/**
 * Queue adapter configuration
 */
export interface QueueAdapterConfig {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  pollInterval?: number;
}
