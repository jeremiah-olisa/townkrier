import { NotificationDriver, MessageMapper } from './driver.interface';
import { RetryConfig } from './retry-config.interface';

/**
 * Configuration for a single driver within a fallback strategy.
 * 
 * @template ConfigType - Type of the driver configuration
 * @template TUnifiedMessage - The unified message format used in notifications
 * @template TDriverMessage - The driver-specific message format
 * 
 * @example
 * ```typescript
 * {
 *   use: WhapiDriver,
 *   config: WhapiDriver.configure({ apiKey: '...' }),
 *   mapper: WhapiMessageMapper,
 *   priority: 10,
 *   enabled: true,
 * }
 * ```
 */
export interface FallbackDriverConfig<
  ConfigType = any,
  TUnifiedMessage = unknown,
  TDriverMessage = unknown
> {
  /**
   * Driver class to instantiate
   */
  use: new (config: ConfigType) => NotificationDriver<ConfigType, any>;
  
  /**
   * Configuration object for the driver
   */
  config: ConfigType;
  
  /**
   * Priority for fallback ordering (higher = tried first)
   */
  priority?: number;
  
  /**
   * Weight for random selection strategy
   */
  weight?: number;
  
  /**
   * Retry configuration for this specific driver
   */
  retryConfig?: RetryConfig;
  
  /**
   * Message mapper to transform unified messages to driver-specific format.
   * Can be either a mapper class (framework instantiates) or instance.
   * 
   * @example
   * ```typescript
   * // Class (recommended)
   * mapper: WhapiMessageMapper
   * 
   * // Instance
   * mapper: new WhapiMessageMapper()
   * ```
   */
  mapper?: MessageMapper<TUnifiedMessage, TDriverMessage> | (new () => MessageMapper<TUnifiedMessage, TDriverMessage>);
  
  /**
   * Whether this driver is enabled
   * @default true
   */
  enabled?: boolean;
}
