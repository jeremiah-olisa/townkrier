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
} from '../../interfaces';
import { NotificationSending, NotificationSent, NotificationFailed } from '../../events';
import { Notification } from '../notification';
import { NotificationChannel } from '../../types';
import { NotificationConfigurationException } from '../../exceptions';
import { Constructor, INotificationManagerBase } from './types';

// We need to define interfaces for methods we expect to exist on the Base class
// from other mixins (ChannelManager, RequestBuilder)
// We need to define interfaces for methods we expect to exist on the Base class
// from other mixins (ChannelManager, RequestBuilder)
export interface IBaseWithDependencies<TChannel extends string = string>
  extends INotificationManagerBase<TChannel> {
  // From ChannelManagerMixin
  getChannel(name: TChannel): any;
  getChannelNameByType(channelType: string): string | null;
  getChannelByType(channelType: string): any;

  // From RequestBuilderMixin
  buildRequest(
    notification: Notification,
    channelType: string,
    recipient: NotificationRecipient,
  ): any | null;
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
          console.warn(`Adapter '${adapter.getChannelName()}' is not ready, trying next...`);
          continue;
        }

        try {
          const response = await adapter.send(request);
          // If we get here, the send was successful
          return response;
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          errors.push({ adapter: adapter.getChannelName(), error: err });
          console.warn(
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
    ): Promise<Map<TChannel, unknown>> {
      const channels = notification.via();
      const responses = new Map<TChannel, unknown>();

      // Dispatch sending event
      if (this.eventDispatcher) {
        await this.eventDispatcher.dispatch(new NotificationSending(notification, channels));
      }

      try {
        for (const channelType of channels) {
          try {
            const request = this.buildRequest(notification, channelType, recipient);

            if (request) {
              // Check if this channel has multiple adapters configured
              const channelName = this.getChannelNameByType(channelType);

              let response;
              if (channelName && this.channelAdapters.has(channelName)) {
                // Use adapter fallback for channels with multiple adapters
                response = await this.sendWithAdapterFallback(channelName as TChannel, request);
              } else {
                // Use legacy single channel approach
                const channel = this.getChannelByType(channelType);
                response = await channel.send(request);
              }

              responses.set(channelType as TChannel, response);
            }
          } catch (error) {
            // Dispatch failed event for this channel
            if (this.eventDispatcher) {
              await this.eventDispatcher.dispatch(
                new NotificationFailed(
                  notification,
                  channels,
                  error instanceof Error ? error : new Error(String(error)),
                  channelType as NotificationChannel,
                ),
              );
            }

            // Re-throw if fallback is not enabled
            if (!this.enableFallback) {
              throw error;
            }
          }
        }

        // Dispatch sent event if at least one channel succeeded
        if (responses.size > 0 && this.eventDispatcher) {
          await this.eventDispatcher.dispatch(
            new NotificationSent(notification, channels, responses),
          );
        }

        return responses;
      } catch (error) {
        // Dispatch failed event
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
