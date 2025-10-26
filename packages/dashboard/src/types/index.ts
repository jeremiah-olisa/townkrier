import { QueueManager } from '@townkrier/queue';
import { StorageManager } from '@townkrier/storage';

/**
 * Dashboard API Router configuration
 */
export interface DashboardApiConfig {
  queueManager: QueueManager;
  storageManager: StorageManager;
}

/**
 * Logger interface for dashboard
 */
export interface DashboardLogger {
  log: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
}

/**
 * Statistics type
 */
export interface DashboardStats {
  queue: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    retrying: number;
    scheduled: number;
  };
  notifications: {
    total: number;
    sent: number;
    delivered?: number;
    failed: number;
    retrying?: number;
    byChannel?: Record<string, number>;
    byStatus?: Record<string, number>;
  };
  timestamp: Date;
}

/**
 * Get stats function type
 */
export type GetStatsFunction = (config: DashboardConfig) => Promise<DashboardStats>;

/**
 * Dashboard configuration for middleware/integration mode
 */
export interface DashboardConfig extends DashboardApiConfig {
  path?: string;
  auth?: {
    enabled: boolean;
    username: string;
    password: string;
  };
  logger?: {
    log: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
    warn: (message: string, ...args: unknown[]) => void;
  };
}

/**
 * Dashboard server configuration (standalone mode)
 */
export interface DashboardServerConfig extends DashboardConfig {
  port?: number;
}
