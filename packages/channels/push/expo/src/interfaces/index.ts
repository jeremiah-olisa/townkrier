/**
 * Expo push message
 */
export interface ExpoMessage {
  to: string | string[];
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  sound?: string | 'default' | null;
  badge?: number;
  channelId?: string;
  categoryId?: string;
  priority?: 'default' | 'normal' | 'high';
  ttl?: number;
  expiration?: number;
  subtitle?: string;
  mutableContent?: boolean;
}

/**
 * Expo notification response
 */
export interface ExpoNotificationResponse {
  id: string;
  status: 'ok' | 'error';
  message?: string;
  details?: Record<string, unknown>;
}
