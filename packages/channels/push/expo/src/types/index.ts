import type { NotificationChannelConfig } from 'townkrier-core';

/**
 * Expo-specific configuration
 */
export interface ExpoConfig extends NotificationChannelConfig {
  /**
   * Expo access token (optional, for additional features)
   */
  accessToken?: string;

  /**
   * Maximum number of retries for failed requests
   */
  maxRetries?: number;

  /**
   * Delay between retries in milliseconds
   */
  retryDelay?: number;
}

/**
 * Expo push ticket response
 */
export interface ExpoTicketResponse {
  id?: string;
  status: 'ok' | 'error';
  message?: string;
  details?: {
    error?: string;
  };
}

/**
 * Expo receipt response
 */
export interface ExpoReceiptResponse {
  status: 'ok' | 'error';
  message?: string;
  details?: {
    error?: string;
  };
}

/**
 * Expo send response with tickets
 */
export interface ExpoSendResponse {
  successCount: number;
  failureCount: number;
  tickets: ExpoTicketResponse[];
}
