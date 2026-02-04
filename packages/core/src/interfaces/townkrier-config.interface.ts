import { DeliveryStrategy } from '../types/delivery-strategy.type';
import { ChannelConfig } from './channel-config.interface';
import { FallbackStrategyConfig } from './fallback-strategy-config.interface';

/**
 * Main configuration interface for the Townkrier Notification Manager.
 *
 * @template ChannelNames - Union type of string literals representing valid channel names (e.g., 'email' | 'sms').
 *
 * @example
 * ```typescript
 * const config: TownkrierConfig<'email'> = {
 *   channels: {
 *     email: { driver: ResendDriver, config: { apiKey: '...' } }
 *   }
 * };
 * ```
 */
export interface TownkrierConfig<ChannelNames extends string = string> {
  /**
   * Default settings for channels
   */
  defaults?: Partial<Record<ChannelNames, string>>;

  /**
   * Channel configurations
   */
  channels: Record<ChannelNames, ChannelConfig | FallbackStrategyConfig>;

  /**
   * Global delivery strategy
   */
  strategy?: DeliveryStrategy;
}
