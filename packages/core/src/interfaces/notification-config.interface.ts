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
// ChannelConfig removed to avoid conflict with townkrier-config.interface.ts
// Use ChannelConfig from townkrier-config.interface.ts instead.

// NotificationManagerConfig removed in favor of TownkrierConfig

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  /**
   * Enable circuit breaker behavior
   */
  enabled?: boolean;

  /**
   * Number of consecutive failures before opening the circuit
   */
  failureThreshold?: number;

  /**
   * Cooldown duration (ms) before attempting again
   */
  cooldownMs?: number;
}

/**
 * Circuit breaker state per channel
 */
export interface CircuitBreakerState {
  failures: number;
  openUntil?: number;
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
