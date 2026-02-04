import { FallbackStrategy } from '../types/fallback-strategy.enum';
import { FallbackDriverConfig } from './fallback-driver-config.interface';

/**
 * Configuration for a channel that uses multiple drivers with a fallback/load-balancing strategy.
 */
export interface FallbackStrategyConfig {
  /**
   * The strategy to use for selecting/iterating drivers.
   * @see FallbackStrategy
   */
  strategy: FallbackStrategy;

  /**
   * List of drivers and their specific configurations.
   */
  drivers: FallbackDriverConfig[];
}
