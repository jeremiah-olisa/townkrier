import { Notifiable } from './driver.interface';
import { Notification } from '../notification';

/**
 * Context passed to send lifecycle callbacks.
 */
export interface NotificationSendHookContext<ChannelNames extends string = string> {
  /**
   * Notification instance being sent.
   */
  notification: Notification<ChannelNames>;
  /**
   * Recipient object implementing Notifiable contract.
   */
  notifiable: Notifiable;
  /**
   * Target channel currently being processed.
   */
  channel?: ChannelNames;
  /**
   * Driver/provider name used for a send attempt.
   */
  provider?: string;
  /**
   * Attempt number for provider-level retries.
   */
  attempt?: number;
  /**
   * Error payload if callback is for failure path.
   */
  error?: unknown;
  /**
   * Raw response payload if callback is for success path.
   */
  response?: unknown;
  /**
   * Optional metadata bag forwarded from send options.
   */
  metadata?: Record<string, unknown>;
}

/**
 * Hooks that can be passed per send operation for observability and custom outbox orchestration.
 * All hooks are optional to preserve backward compatibility.
 */
export interface NotificationSendHooks<ChannelNames extends string = string> {
  onSendStart?: (context: NotificationSendHookContext<ChannelNames>) => void | Promise<void>;
  onChannelStart?: (context: NotificationSendHookContext<ChannelNames>) => void | Promise<void>;
  onProviderAttempt?: (context: NotificationSendHookContext<ChannelNames>) => void | Promise<void>;
  onProviderSuccess?: (context: NotificationSendHookContext<ChannelNames>) => void | Promise<void>;
  onProviderFailure?: (context: NotificationSendHookContext<ChannelNames>) => void | Promise<void>;
  onChannelSuccess?: (context: NotificationSendHookContext<ChannelNames>) => void | Promise<void>;
  onChannelFailure?: (context: NotificationSendHookContext<ChannelNames>) => void | Promise<void>;
  onSendComplete?: (
    context: NotificationSendHookContext<ChannelNames> & {
      status: 'success' | 'partial' | 'failed';
      results: Map<string, unknown>;
      errors: Map<string, Error>;
    },
  ) => void | Promise<void>;
}
