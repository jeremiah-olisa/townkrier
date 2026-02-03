import { TownkrierConfig } from './interfaces/townkrier-config.interface';
import { NotificationManager } from './notification-manager';

/**
 * Factory class for creating NotificationManager instances.
 * Acts as the main entry point for the library.
 */
export class TownkrierFactory {
  /**
   * Creates a configured NotificationManager.
   *
   * @template ChannelNames - Union type of channel names used in config.
   * @param config - The Townkrier configuration object.
   * @returns A new instance of NotificationManager.
   *
   * @example
   * ```typescript
   * const manager = TownkrierFactory.create({
   *   channels: { ... }
   * });
   * ```
   */
  static create<ChannelNames extends string = string>(config: TownkrierConfig<ChannelNames>) {
    return new NotificationManager<ChannelNames>(config);
  }
}
