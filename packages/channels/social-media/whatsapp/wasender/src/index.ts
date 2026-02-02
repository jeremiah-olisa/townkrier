import { NotificationChannelConfig, NotificationStatus, Logger } from 'townkrier-core';
import axios, { AxiosInstance } from 'axios';
import { WhatsAppChannel, WhatsAppRequest, WhatsAppResponse } from 'townkrier-whatsapp-common';

export interface WasenderConfig extends NotificationChannelConfig {
  apiKey: string;
  baseUrl?: string;
  senderId?: string;
}

/**
 * Wasender WhatsApp adapter
 * Sends WhatsApp messages via Wasender API service
 */
export class WasenderAdapter extends WhatsAppChannel {
  private readonly httpClient: AxiosInstance;
  private readonly senderId?: string;

  constructor(config: WasenderConfig) {
    super(config, 'wasender');

    const baseUrl = config.baseUrl || 'https://wasenderapi.com/api';
    this.senderId = config.senderId;

    this.httpClient = axios.create({
      baseURL: baseUrl,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30_000,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isValidNotificationRequest(request: any): request is WhatsAppRequest {
    return !!request.to?.phone && !!request.text;
  }

  async send(request: WhatsAppRequest): Promise<WhatsAppResponse> {
    try {
      const response = await this.httpClient.post('send-message', {
        to: request.to.phone,
        text: request.text,
        // sender_id: this.senderId, // Optional, only if configured
      });

      return {
        messageId: response.data.message_id || response.data.id,
        status: NotificationStatus.SENT,
        sentAt: new Date(),
      };
    } catch (error) {
      Logger.error('[WasenderAdapter] Wasender send failed', error);
      return {
        messageId: '',
        status: NotificationStatus.FAILED,
        sentAt: new Date(),
      };
    }
  }
}

/**
 * Factory function to create Wasender adapter instance
 */
export function createWasenderAdapter(config: WasenderConfig): WasenderAdapter {
  return new WasenderAdapter(config);
}
