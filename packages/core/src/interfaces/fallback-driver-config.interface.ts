import { NotificationDriver } from './driver.interface';

export interface FallbackDriverConfig<ConfigType = any> {
  use: new (config: ConfigType) => NotificationDriver<ConfigType, any>;
  config: ConfigType;
  priority?: number;
  weight?: number;
}
