import { IStorageAdapter, NotificationLog } from '../interfaces';
import { NotificationLogStatus } from '../types';
import { NotificationChannel } from '@townkrier/core';

/**
 * Storage Manager for notification logs
 */
export class StorageManager {
  private adapter: IStorageAdapter;

  constructor(adapter: IStorageAdapter) {
    this.adapter = adapter;
  }

  /**
   * Log a notification
   */
  async logNotification(
    log: Omit<NotificationLog, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<NotificationLog> {
    return this.adapter.save(log);
  }

  /**
   * Update a notification log
   */
  async updateLog(id: string, updates: Partial<NotificationLog>): Promise<NotificationLog> {
    return this.adapter.update(id, updates);
  }

  /**
   * Get a log by ID
   */
  async getLog(id: string): Promise<NotificationLog | null> {
    return this.adapter.getById(id);
  }

  /**
   * Query logs
   */
  async queryLogs(filters: {
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
    return this.adapter.query(filters);
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
    return this.adapter.getStats(filters);
  }

  /**
   * Cleanup old logs
   */
  async cleanup(olderThan: Date): Promise<number> {
    return this.adapter.cleanup(olderThan);
  }

  /**
   * Get the underlying adapter
   */
  getAdapter(): IStorageAdapter {
    return this.adapter;
  }
}
