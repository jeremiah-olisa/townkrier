import { NotificationDriver } from './driver.interface';

/**
 * Configuration for a single-driver channel.
 *
 * @template ConfigType - Type of the driver's configuration.
 */
export interface ChannelConfig<ConfigType = any> {
  /**
   * The driver class to instantiate.
   */
  driver: new (config: ConfigType) => NotificationDriver<ConfigType, any>;

  /**
   * Configuration object passed to the driver's constructor.
   */
  config: ConfigType;
}
