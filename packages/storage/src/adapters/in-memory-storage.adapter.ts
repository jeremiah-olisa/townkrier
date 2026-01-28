import { randomUUID } from 'crypto';
import { NotificationChannel } from 'townkrier-core';
import { IStorageAdapter, NotificationLog, StorageAdapterConfig } from '../interfaces';
import { NotificationLogStatus, ContentPrivacy } from '../types';
import { LogNotFoundException } from '../exceptions';

/**
 * In-memory storage adapter implementation
 */
export class InMemoryStorageAdapter implements IStorageAdapter {
  private logs: Map<string, NotificationLog> = new Map();
  private config: StorageAdapterConfig;

  constructor(config: StorageAdapterConfig = {}) {
    this.config = {
      maskSensitiveContent: config.maskSensitiveContent ?? true,
      contentPrivacyLevel: config.contentPrivacyLevel ?? ContentPrivacy.MASKED,
      retentionDays: config.retentionDays ?? 30,
      autoCleanup: config.autoCleanup ?? false,
    };
  }

  /**
   * Save a notification log
   */
  async save(
    log: Omit<NotificationLog, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<NotificationLog> {
    const id = randomUUID();
    const now = new Date();

    const newLog: NotificationLog = {
      ...log,
      id,
      createdAt: now,
      updatedAt: now,
      contentPrivacy: this.config.contentPrivacyLevel ?? ContentPrivacy.MASKED,
    };

    // Apply content masking if enabled
    if (this.config.maskSensitiveContent) {
      newLog.content = this.maskContent(newLog.content);
    }

    this.logs.set(id, newLog);
    return newLog;
  }

  /**
   * Update an existing notification log
   */
  async update(id: string, updates: Partial<NotificationLog>): Promise<NotificationLog> {
    const log = this.logs.get(id);
    if (!log) {
      throw new LogNotFoundException(id);
    }

    const updatedLog: NotificationLog = {
      ...log,
      ...updates,
      id, // Prevent ID change
      createdAt: log.createdAt, // Prevent createdAt change
      updatedAt: new Date(),
    };

    this.logs.set(id, updatedLog);
    return updatedLog;
  }

  /**
   * Get a notification log by ID
   */
  async getById(id: string): Promise<NotificationLog | null> {
    return this.logs.get(id) || null;
  }

  /**
   * Query notification logs with filters
   */
  async query(filters: {
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
  }> {
    let logs = Array.from(this.logs.values());

    // Apply filters
    if (filters.notificationId) {
      logs = logs.filter((log) => log.notificationId === filters.notificationId);
    }
    if (filters.channel) {
      logs = logs.filter((log) => log.channel === filters.channel);
    }
    if (filters.status) {
      logs = logs.filter((log) => log.status === filters.status);
    }
    if (filters.recipient) {
      logs = logs.filter((log) => log.recipient.includes(filters.recipient!));
    }
    if (filters.startDate) {
      logs = logs.filter((log) => log.createdAt >= filters.startDate!);
    }
    if (filters.endDate) {
      logs = logs.filter((log) => log.createdAt <= filters.endDate!);
    }
    if (filters.tags && filters.tags.length > 0) {
      logs = logs.filter((log) => log.tags && filters.tags!.some((tag) => log.tags!.includes(tag)));
    }

    const total = logs.length;

    // Sort
    const sortBy = filters.sortBy ?? 'createdAt';
    const sortOrder = filters.sortOrder ?? 'desc';
    logs.sort((a, b) => {
      const aValue = a[sortBy]?.getTime() ?? 0;
      const bValue = b[sortBy]?.getTime() ?? 0;
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    // Paginate
    const offset = filters.offset ?? 0;
    const limit = filters.limit ?? logs.length;
    logs = logs.slice(offset, offset + limit);

    return { logs, total };
  }

  /**
   * Get statistics
   */
  async getStats(filters?: {
    startDate?: Date;
    endDate?: Date;
    channel?: NotificationChannel;
  }): Promise<{
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    retrying: number;
    byChannel: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    let logs = Array.from(this.logs.values());

    // Apply filters
    if (filters?.startDate) {
      logs = logs.filter((log) => log.createdAt >= filters.startDate!);
    }
    if (filters?.endDate) {
      logs = logs.filter((log) => log.createdAt <= filters.endDate!);
    }
    if (filters?.channel) {
      logs = logs.filter((log) => log.channel === filters.channel);
    }

    const byChannel: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const log of logs) {
      byChannel[log.channel] = (byChannel[log.channel] || 0) + 1;
      byStatus[log.status] = (byStatus[log.status] || 0) + 1;
    }

    return {
      total: logs.length,
      sent: logs.filter((l) => l.status === NotificationLogStatus.SENT).length,
      delivered: logs.filter((l) => l.status === NotificationLogStatus.DELIVERED).length,
      failed: logs.filter((l) => l.status === NotificationLogStatus.FAILED).length,
      retrying: logs.filter((l) => l.status === NotificationLogStatus.RETRYING).length,
      byChannel,
      byStatus,
    };
  }

  /**
   * Delete old logs
   */
  async cleanup(olderThan: Date): Promise<number> {
    let count = 0;
    for (const [id, log] of this.logs.entries()) {
      if (log.createdAt < olderThan) {
        this.logs.delete(id);
        count++;
      }
    }
    return count;
  }

  /**
   * Clear all logs (for testing)
   */
  async clear(): Promise<void> {
    this.logs.clear();
  }

  /**
   * Mask sensitive content
   */
  private maskContent(content?: string): string | undefined {
    if (!content) return content;

    // Simple masking: show first and last 10 chars, mask the middle
    if (content.length <= 20) {
      return '*'.repeat(content.length);
    }

    return (
      content.substring(0, 10) +
      '*'.repeat(content.length - 20) +
      content.substring(content.length - 10)
    );
  }
}
