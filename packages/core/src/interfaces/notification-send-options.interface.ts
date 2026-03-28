import { NotificationSendHooks } from './notification-send-hooks.interface';

/**
 * Optional per-send configuration.
 * Designed to be additive and backward compatible.
 */
export interface NotificationSendOptions<ChannelNames extends string = string> {
  /**
   * If provided, only these channels are attempted.
   * Values are intersected with notification.via() channels.
   */
  channels?: ChannelNames[];
  /**
   * Optional channel-level predicate filter applied after channels intersection.
   */
  channelFilter?: (channel: ChannelNames) => boolean;
  /**
   * Optional lifecycle hooks for send orchestration and observability.
   */
  hooks?: NotificationSendHooks<ChannelNames>;
  /**
   * Optional metadata bag forwarded to hooks and provider callbacks.
   */
  metadata?: Record<string, unknown>;
}
