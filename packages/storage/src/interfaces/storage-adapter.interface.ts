import { NotificationChannel, NotificationPriority } from 'townkrier-core';
import { NotificationLogStatus, ContentPrivacy } from '../types';

/**
 * Notification log entry
 */
export interface NotificationLog {
  id: string;
  notificationId: string;
  channel: NotificationChannel;
  recipient: string; // Masked or sanitized recipient info
  status: NotificationLogStatus;
  priority?: NotificationPriority;

  // Timing
  scheduledFor?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;

  // Content (may be masked for privacy)
  subject?: string;
  content?: string;
  contentPrivacy: ContentPrivacy;

  // Retry tracking
  attempts: number;
  maxRetries?: number;
  retryLogs: RetryLog[];

  // Metadata
  error?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Retry log entry
 */
export interface RetryLog {
  attempt: number;
  timestamp: Date;
  status: NotificationLogStatus;
  error?: string;
  duration?: number; // milliseconds
}

/**
 * Storage adapter interface
 */
export interface IStorageAdapter {
  /**
   * Save a notification log
   */
  save(log: Omit<NotificationLog, 'id' | 'createdAt' | 'updatedAt'>): Promise<NotificationLog>;

  /**
   * Update an existing notification log
   */
  update(id: string, updates: Partial<NotificationLog>): Promise<NotificationLog>;

  /**
   * Get a notification log by ID
   */
  getById(id: string): Promise<NotificationLog | null>;

  /**
   * Get notification logs with filters
   */
  query(filters: {
    notificationId?: string;
    channel?: NotificationChannel;
    status?: NotificationLogStatus;
    recipient?: string;
    startDate?: Date;
    endDate?: Date;
    tags?: string[];
    limit?: number;
    offset?: number;
    sortBy?: 'createdAt' | 'sentAt' | 'deliveredAt';
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    logs: NotificationLog[];
    total: number;
  }>;

  /**
   * Get statistics
   */
  getStats(filters?: { startDate?: Date; endDate?: Date; channel?: NotificationChannel }): Promise<{
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    retrying: number;
    byChannel: Record<string, number>;
    byStatus: Record<string, number>;
  }>;

  /**
   * Delete old logs
   */
  cleanup(olderThan: Date): Promise<number>;

  /**
   * Clear all logs (for testing)
   */
  clear?(): Promise<void>;
}

/**
 * Storage adapter configuration
 */
export interface StorageAdapterConfig {
  // Content privacy settings
  maskSensitiveContent?: boolean;
  contentPrivacyLevel?: ContentPrivacy;

  // Retention settings
  retentionDays?: number;
  autoCleanup?: boolean;
}
