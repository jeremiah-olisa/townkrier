import { NotificationDriver } from './driver.interface';
import { RetryConfig } from './retry-config.interface';

export interface FallbackDriverConfig<ConfigType = any> {
  use: new (config: ConfigType) => NotificationDriver<ConfigType, any>;
  config: ConfigType;
  priority?: number;
  weight?: number;
  retryConfig?: RetryConfig;
  enabled?: boolean;
}
