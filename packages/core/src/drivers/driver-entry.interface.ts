import { NotificationDriver } from '../interfaces/driver.interface';
import { RetryConfig } from '../interfaces/retry-config.interface';

export interface DriverEntry {
  driver: NotificationDriver;
  priority?: number;
  weight?: number;
  retryConfig?: RetryConfig;
  /**
   * Whether this driver is enabled.
   * @default true
   * Set to false to disable this driver without removing it from configuration.
   */
  enabled?: boolean;
}
