/**
 * Base configuration for notification channels
 */
export interface NotificationChannelConfig {
  /**
   * API key or secret key for the service
   */
  apiKey?: string;

  /**
   * Secret key for the service
   */
  secretKey?: string;

  /**
   * Base URL for the service API
   */
  baseUrl?: string;

  /**
   * Request timeout in milliseconds
   */
  timeout?: number;

  /**
   * Enable debug mode
   */
  debug?: boolean;

  /**
   * Additional configuration specific to the provider
   */
  [key: string]: unknown;
}

/**
 * Environment-specific configuration for a notification channel
 */
export interface ChannelEnvConfig extends NotificationChannelConfig {
  /**
   * Any additional provider-specific configuration
   */
  [key: string]: unknown;
}

/**
 * Configuration for a single notification channel in the manager
 */
export interface ChannelConfig {
  /**
   * Name of the channel (e.g., 'email', 'sms')
   */
  name: string;

  /**
   * Whether this channel is enabled
   */
  enabled?: boolean;

  /**
   * Priority for fallback (higher = preferred)
   */
  priority?: number;

  /**
   * Channel-specific configuration
   */
  config: ChannelEnvConfig;
}

/**
 * Notification manager configuration
 */
export interface NotificationManagerConfig {
  /**
   * Default channel to use
   */
  defaultChannel?: string;

  /**
   * Enable fallback to other channels on failure
   */
  enableFallback?: boolean;

  /**
   * List of channel configurations
   */
  channels: ChannelConfig[];
}

/**
 * Factory function type for creating channel instances
 */
export type ChannelFactory<T = ChannelEnvConfig> = (config: T) => {
  send(notification: unknown): Promise<unknown>;
  getChannelName(): string;
  getChannelType(): string;
  isReady(): boolean;
};
