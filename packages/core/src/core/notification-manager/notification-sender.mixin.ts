import {
  SendEmailRequest,
  SendSmsRequest,
  SendPushRequest,
  SendInAppRequest,
  SendEmailResponse,
  SendSmsResponse,
  SendPushResponse,
  SendInAppResponse,
  NotificationRecipient,
  DeliveryStrategy,
  NotificationResult,
  CircuitBreakerState,
  INotificationChannel,
} from '../../interfaces';
import { NotificationSending, NotificationSent, NotificationFailed } from '../../events';
import { Notification } from '../notification';
import { NotificationChannel } from '../../types';
import { NotificationConfigurationException } from '../../exceptions';
import { Constructor, INotificationManagerBase } from './types';
import { Logger } from '../../logger';

// We need to define interfaces for methods we expect to exist on the Base class
// from other mixins (ChannelManager, RequestBuilder)
// We need to define interfaces for methods we expect to exist on the Base class
// from other mixins (ChannelManager, RequestBuilder)
export interface IBaseWithDependencies<TChannel extends string = string>
  extends INotificationManagerBase<TChannel> {
  strategy: DeliveryStrategy;
  // From ChannelManagerMixin
  getChannel(name: TChannel): INotificationChannel;
  getChannelNameByType(channelType: string): string | null;
  getChannelByType(channelType: string): INotificationChannel;

  // From RequestBuilderMixin
  buildRequest(
    notification: Notification,
    channelType: string,
    recipient: NotificationRecipient,
  ): Promise<
    | SendEmailRequest
    | SendSmsRequest
    | SendPushRequest
    | SendInAppRequest
    | Record<string, unknown>
    | null
  >;
}

/**
 * Mixin for sending notifications
 */
export function NotificationSenderMixin<
  TChannel extends string,
  TBase extends Constructor<IBaseWithDependencies<TChannel>>,
>(Base: TBase) {
  return class NotificationSender extends Base {
    /**
     * Check if circuit breaker is enabled
     */
    public isCircuitBreakerEnabled(): boolean {
      return this.circuitBreaker?.enabled === true;
    }

    /**
     * Get circuit breaker state for a channel
     */
    public getCircuitState(channelKey: string): CircuitBreakerState {
      const normalized = channelKey.toLowerCase();
      const existing = this.circuitBreakerState.get(normalized);

      if (existing) {
        // If cooldown elapsed, reset
        if (existing.openUntil && Date.now() >= existing.openUntil) {
          const reset: CircuitBreakerState = { failures: 0 };
          this.circuitBreakerState.set(normalized, reset);
          return reset;
        }

        return existing;
      }

      const fresh: CircuitBreakerState = { failures: 0 };
      this.circuitBreakerState.set(normalized, fresh);
      return fresh;
    }

    /**
     * Check if circuit is open for a channel
     */
    public isCircuitOpen(channelKey: string): boolean {
      if (!this.isCircuitBreakerEnabled()) return false;
      const state = this.getCircuitState(channelKey);
      return !!state.openUntil && Date.now() < state.openUntil;
    }

    /**
     * Record a successful send for a channel
     */
    public recordCircuitSuccess(channelKey: string): void {
      if (!this.isCircuitBreakerEnabled()) return;
      const state = this.getCircuitState(channelKey);
      state.failures = 0;
      delete state.openUntil;
      this.circuitBreakerState.set(channelKey.toLowerCase(), state);
    }

    /**
     * Record a failed send for a channel
     */
    public recordCircuitFailure(channelKey: string): void {
      if (!this.isCircuitBreakerEnabled()) return;
      const state = this.getCircuitState(channelKey);
      state.failures += 1;

      if (state.failures >= this.circuitBreaker.failureThreshold) {
        state.openUntil = Date.now() + this.circuitBreaker.cooldownMs;
      }

      this.circuitBreakerState.set(channelKey.toLowerCase(), state);
    }

    /**
     * Send notification through a channel with adapter fallback support
     */
    async sendWithAdapterFallback(
      channelName: TChannel,
      request:
        | SendEmailRequest
        | SendSmsRequest
        | SendPushRequest
        | SendInAppRequest
        | Record<string, unknown>,
    ): Promise<
      SendEmailResponse | SendSmsResponse | SendPushResponse | SendInAppResponse | unknown
    > {
      const adapters = this.channelAdapters.get(channelName.toLowerCase());

      // If no adapters configured for this channel, try legacy single channel approach
      if (!adapters || adapters.length === 0) {
        const channel = this.getChannel(channelName);
        return await channel.send(request);
      }

      // Try each adapter in priority order
      const errors: Array<{ adapter: string; error: Error; skipped?: boolean }> = [];

      for (const adapter of adapters) {
        if (!adapter.isReady()) {
          const notReadyError = new Error('Adapter not ready');
          errors.push({
            adapter: adapter.getChannelName(),
            error: notReadyError,
            skipped: true,
          });
          Logger.warn(`Adapter '${adapter.getChannelName()}' is not ready, trying next...`);
          continue;
        }

        try {
          const response = await adapter.send(request);
          // If we get here, the send was successful
          return response;
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          errors.push({ adapter: adapter.getChannelName(), error: err });
          Logger.warn(
            `Adapter '${adapter.getChannelName()}' failed: ${err.message}, trying next adapter...`,
          );
        }
      }

      // All adapters failed, throw comprehensive error
      const errorMessages = errors.map((e) => `${e.adapter}: ${e.error.message}`).join('; ');
      throw new NotificationConfigurationException(
        `All adapters failed for channel '${channelName}': ${errorMessages}`,
        {
          channelName,
          attemptedAdapters: errors.map((e) => e.adapter),
          errors: errors.map((e) => e.error.message),
        },
      );
    }

    /**
     * Send a notification through specified channels
     */
    async send(
      notification: Notification,
      recipient: NotificationRecipient,
      strategyOverride?: DeliveryStrategy,
    ): Promise<NotificationResult> {
      const channels = notification.via();
      const strategy = strategyOverride || this.strategy;
      const results = new Map<string, unknown>();
      const errors = new Map<string, Error>();

      // Dispatch sending event
      if (this.eventDispatcher) {
        await this.eventDispatcher.dispatch(new NotificationSending(notification, channels));
      }

      const sendToChannel = async (channelType: string) => {
        try {
          if (this.isCircuitOpen(channelType)) {
            const circuitError = new Error(
              `Circuit open for channel '${channelType}', skipping send`,
            );
            errors.set(channelType, circuitError);

            if (this.eventDispatcher) {
              await this.eventDispatcher.dispatch(
                new NotificationFailed(
                  notification,
                  channels,
                  circuitError,
                  channelType as NotificationChannel,
                ),
              );
            }

            return;
          }

          const request = await this.buildRequest(notification, channelType, recipient);

          if (!request) {
            // Channel defined in via() but no toX method or recipient info -> skip or consider no-op
            return;
          }

          let response;
          const channelName = this.getChannelNameByType(channelType);

          if (channelName && this.channelAdapters.has(channelName)) {
            response = await this.sendWithAdapterFallback(channelName as TChannel, request);
          } else {
            const channel = this.getChannelByType(channelType);
            response = await channel.send(request);
          }

          results.set(channelType, response);
          this.recordCircuitSuccess(channelType);
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          errors.set(channelType, err);
          this.recordCircuitFailure(channelType);

          // Dispatch failed event per channel
          if (this.eventDispatcher) {
            await this.eventDispatcher.dispatch(
              new NotificationFailed(
                notification,
                channels,
                err,
                channelType as NotificationChannel,
              ),
            );
          }

          if (strategy === 'all-or-nothing' && !this.isCircuitBreakerEnabled()) {
            throw err; // Fail fast
          }
        }
      };

      try {
        if (strategy === 'best-effort') {
          // Run all in parallel (or sequential if preferred, but parallel is usually better for best-effort)
          await Promise.allSettled(channels.map((ch) => sendToChannel(String(ch))));
        } else {
          // Sequential for all-or-nothing to fail fast reliably?
          // actually parallel fail-fast (Promise.all) is also an option, but sequential is safer for "stop on error"
          // Let's stick to sequential loop for all-or-nothing to match previous behavior
          for (const channelType of channels) {
            await sendToChannel(String(channelType));
          }
        }

        const status = errors.size === 0 ? 'success' : results.size > 0 ? 'partial' : 'failed';

        // Dispatch final sent event if at least one succeeded
        if (results.size > 0 && this.eventDispatcher) {
          // Note: responses map in event might need to be Map<TChannel, unknown>
          // casting keys for now
          const typedResults = new Map<TChannel, unknown>();
          results.forEach((v, k) => typedResults.set(k as TChannel, v));

          await this.eventDispatcher.dispatch(
            new NotificationSent(notification, channels, typedResults),
          );
        }

        return {
          status,
          results,
          errors,
        };
      } catch (error) {
        // This catch block is hit only for 'all-or-nothing' fast fail or unexpected errors
        if (this.eventDispatcher) {
          await this.eventDispatcher.dispatch(
            new NotificationFailed(
              notification,
              channels,
              error instanceof Error ? error : new Error(String(error)),
            ),
          );
        }
        throw error;
      }
    }
  };
}
