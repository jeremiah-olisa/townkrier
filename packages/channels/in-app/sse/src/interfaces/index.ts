import type { IInAppChannel } from 'townkrier-core';
import type { SseResponse } from '../types';

/**
 * SSE message format
 */
export interface SseMessage {
  event?: string;
  data: string;
  id?: string;
  retry?: number;
}

/**
 * SSE connection status
 */
export interface SseConnectionStatus {
  userId: string;
  activeConnections: number;
  lastActivity: Date;
}

/**
 * SSE Channel Interface - extends IInAppChannel with SSE-specific methods
 */
export interface ISseChannel extends IInAppChannel {
  /**
   * Add a new SSE connection for a user
   * @param userId - The user identifier
   * @param response - The HTTP response object to write SSE data to
   */
  addConnection(userId: string, response: SseResponse): void;

  /**
   * Remove an SSE connection for a user
   * @param userId - The user identifier
   * @param response - The HTTP response object to remove
   */
  removeConnection(userId: string, response: SseResponse): void;

  /**
   * Get the total number of active SSE connections across all users
   * @returns The total connection count
   */
  getConnectionCount(): number;

  /**
   * Get the number of active SSE connections for a specific user
   * @param userId - The user identifier
   * @returns The number of connections for the user
   */
  getUserConnectionCount(userId: string): number;

  /**
   * Get all currently connected user IDs
   * @returns Array of user IDs with active connections
   */
  getConnectedUsers(): string[];
}
