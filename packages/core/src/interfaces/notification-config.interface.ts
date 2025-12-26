import { ITemplateRenderer } from './template-renderer.interface';

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
 * Configuration for a single adapter within a channel
 */
export interface AdapterConfig {
  /**
   * Name of the adapter (e.g., 'resend', 'smtp', 'postmark')
   */
  name: string;

  /**
   * Whether this adapter is enabled
   */
  enabled?: boolean;

  /**
   * Priority for fallback within the channel (higher = preferred)
   */
  priority?: number;

  /**
   * Adapter-specific configuration
   */
  config: ChannelEnvConfig;
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
   * Channel-specific configuration (legacy support - single adapter)
   * @deprecated Use 'adapters' array for multiple adapter support
   */
  config?: ChannelEnvConfig;

  /**
   * List of adapters for this channel (new multi-adapter support)
   * When multiple adapters are configured, they will be tried in priority order
   */
  adapters?: AdapterConfig[];
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
   * Delivery strategy to use
   * - 'all-or-nothing': Fails immediately if any channel fails (default)
   * - 'best-effort': Continues sending to other channels even if one fails
   */
  strategy?: 'all-or-nothing' | 'best-effort';

  /**
   * Enable fallback to other channels on failure
   */
  enableFallback?: boolean;

  /**
   * Template renderer for rendering notification content
   */
  renderer?: ITemplateRenderer;

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
