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
  getChannel(name: TChannel): any;
  getChannelNameByType(channelType: string): string | null;
  getChannelByType(channelType: string): any;

  // From RequestBuilderMixin
  buildRequest(
    notification: Notification,
    channelType: string,
    recipient: NotificationRecipient,
  ): Promise<any | null>;
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
     * Send notification through a channel with adapter fallback support
     */
    async sendWithAdapterFallback(
      channelName: TChannel,
      request: SendEmailRequest | SendSmsRequest | SendPushRequest | SendInAppRequest,
    ): Promise<SendEmailResponse | SendSmsResponse | SendPushResponse | SendInAppResponse> {
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
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          errors.set(channelType, err);

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

          if (strategy === 'all-or-nothing') {
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
