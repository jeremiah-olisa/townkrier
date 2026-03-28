import { NotificationSendHooks } from './notification-send-hooks.interface';

/**
 * Optional send-time controls and callbacks.
 * This interface is additive and does not affect existing calls that omit options.
 */
export interface NotificationSendOptions<ChannelNames extends string = string> {
  /**
   * Optional list of channels to send through for this specific send call.
   * When provided, channels are intersected with notification.via(...) output.
   */
  channels?: ChannelNames[];

  /**
   * Optional predicate for advanced channel selection.
   * Applied after channel intersection.
   */
  channelFilter?: (channel: ChannelNames) => boolean;

  /**
   * Optional lifecycle hooks for observability and outbox orchestration.
   */
  hooks?: NotificationSendHooks<ChannelNames>;

  /**
   * Optional caller-defined metadata echoed into hook contexts.
   */
  metadata?: Record<string, unknown>;
}

