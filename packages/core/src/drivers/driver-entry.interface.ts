import { NotificationDriver, MessageMapper } from '../interfaces/driver.interface';
import { RetryConfig } from '../interfaces/retry-config.interface';

/**
 * Configuration entry for a notification driver in a fallback strategy.
 * Supports two patterns:
 * 
 * Pattern 1: Declarative (Recommended)
 * ```typescript
 * {
 *   use: WhapiDriver,
 *   config: WhapiDriver.configure({ apiUrl: '...', token: '...' }),
 *   mapper: WhapiMessageMapper,
 *   priority: 10,
 *   enabled: true,
 * }
 * ```
 * 
 * Pattern 2: Imperative (Manual instantiation)
 * ```typescript
 * {
 *   driver: new WhapiDriver({ apiUrl: '...', token: '...' }),
 *   mapper: new WhapiMessageMapper(),
 *   priority: 10,
 * }
 * ```
 */
export interface DriverEntry<TUnifiedMessage = unknown, TDriverMessage = unknown> {
  /**
   * Driver class to instantiate (declarative pattern).
   * Use with `config` property. Framework handles instantiation.
   */
  use?: new (config: any) => NotificationDriver;
  
  /**
   * Configuration object for the driver (declarative pattern).
   * Use with `use` property. Pass result of Driver.configure().
   */
  config?: any;
  
  /**
   * Driver instance (imperative pattern).
   * Use when you need manual control over instantiation.
   */
  driver?: NotificationDriver;
  
  priority?: number;
  weight?: number;
  retryConfig?: RetryConfig;
  
  /**
   * Message mapper to transform notification messages to driver-specific format.
   * Can be either a mapper class (declarative) or instance (imperative).
   * 
   * Declarative:
   * ```typescript
   * mapper: WhapiMessageMapper  // Class - framework instantiates
   * ```
   * 
   * Imperative:
   * ```typescript
   * mapper: new WhapiMessageMapper()  // Instance - manual control
   * ```
   */
  mapper?: MessageMapper<TUnifiedMessage, TDriverMessage> | (new () => MessageMapper<TUnifiedMessage, TDriverMessage>);
  
  /**
   * Whether this driver is enabled.
   * @default true
   */
  enabled?: boolean;
}
