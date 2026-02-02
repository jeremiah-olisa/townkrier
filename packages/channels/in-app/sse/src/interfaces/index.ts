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
