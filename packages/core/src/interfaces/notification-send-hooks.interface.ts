import { Notification } from '../notification';
import { Notifiable } from './driver.interface';

/**
 * Structured provider attempt metadata.
 * Useful for outbox systems that need provider/channel-level observability.
 */
export interface ProviderAttemptMeta {
  provider: string;
  attempt: number;
  status: 'success' | 'failed';
  error?: string;
  timestamp: Date;
}

/**
 * Base callback context shared across send lifecycle hooks.
 */
export interface NotificationSendHookContext<ChannelNames extends string = string> {
  notification: Notification<ChannelNames>;
  notifiable: Notifiable;
  channel?: ChannelNames;
  provider?: string;
  attempt?: number;
  error?: Error;
  result?: unknown;
  metadata?: Record<string, unknown>;
}

/**
 * Optional lifecycle callbacks for per-send observability and orchestration.
 * All callbacks are best-effort and never block notification delivery.
 */
export interface NotificationSendHooks<ChannelNames extends string = string> {
  onSendStart?(context: NotificationSendHookContext<ChannelNames>): void | Promise<void>;
  onChannelStart?(context: NotificationSendHookContext<ChannelNames>): void | Promise<void>;
  onProviderAttempt?(context: NotificationSendHookContext<ChannelNames>): void | Promise<void>;
  onProviderSuccess?(context: NotificationSendHookContext<ChannelNames>): void | Promise<void>;
  onProviderFailure?(context: NotificationSendHookContext<ChannelNames>): void | Promise<void>;
  onChannelSuccess?(context: NotificationSendHookContext<ChannelNames>): void | Promise<void>;
  onChannelFailure?(context: NotificationSendHookContext<ChannelNames>): void | Promise<void>;
  onSendComplete?(context: NotificationSendHookContext<ChannelNames>): void | Promise<void>;
}

