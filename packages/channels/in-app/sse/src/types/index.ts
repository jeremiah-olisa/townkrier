import type { NotificationChannelConfig } from 'townkrier-core';

/**
 * SSE connection response object
 * This should be the HTTP Response object from Express, Koa, etc.
 */
export type SseResponse = any; // Using 'any' for framework compatibility

/**
 * SSE-specific configuration
 */
export interface SseConfig extends NotificationChannelConfig {
  /**
   * Interval in milliseconds to send heartbeat comments to keep connections alive
   * Default: 30000 (30 seconds)
   */
  heartbeatInterval?: number;

  /**
   * Maximum number of concurrent connections per user
   * Default: 10
   */
  maxConnections?: number;

  /**
   * Custom event type name
   * Default: 'notification'
   */
  eventType?: string;
}

/**
 * SSE notification event data
 */
export interface SseNotificationEvent {
  id: string;
  userId: string;
  title: string;
  message: string;
  type?: string;
  actionUrl?: string;
  icon?: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Active SSE connection information
 */
export interface SseConnection {
  userId: string;
  response: SseResponse;
  connectedAt: Date;
  lastHeartbeat: Date;
}
