import { NotificationChannelConfig, NotificationStatus, Logger } from 'townkrier-core';
import axios, { AxiosError, AxiosInstance } from 'axios';
import { WhatsAppChannel, WhatsAppRequest, WhatsAppResponse } from 'townkrier-whatsapp-common';

export interface WhapiConfig extends NotificationChannelConfig {
  apiKey: string;
  baseUrl?: string;
}

interface WhapiSendMessageResponse {
  sent?: boolean;
  message?: {
    id?: string;
    message_id?: string;
  };
  id?: string;
  message_id?: string;
}

interface WhapiErrorResponse {
  error?: {
    code?: number;
    message?: string;
    details?: string;
    href?: string;
    support?: string;
  };
}

/**
 * WHAPI WhatsApp adapter
 * Sends WhatsApp messages via WHAPI.cloud service
 */
export class WhapiAdapter extends WhatsAppChannel {
  private readonly httpClient: AxiosInstance;

  constructor(config: WhapiConfig) {
    super(config, 'whapi');

    const baseUrl = config.baseUrl || 'https://gate.whapi.cloud';

    this.httpClient = axios.create({
      baseURL: baseUrl,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
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
      const response = await this.httpClient.post<WhapiSendMessageResponse>('/messages/text', {
        to: request.to.phone,
        body: request.text,
      });

      const messageId =
        response.data?.message?.id ||
        response.data?.message?.message_id ||
        response.data?.id ||
        response.data?.message_id ||
        '';

      const wasSent = response.data?.sent !== false;

      return {
        messageId,
        status: wasSent ? NotificationStatus.SENT : NotificationStatus.FAILED,
        sentAt: new Date(),
      };
    } catch (error: unknown) {
      const errorMessage = this.getErrorMessage(error);
      Logger.error(`[WhapiAdapter] WHAPI send failed: ${errorMessage}`);
      return {
        messageId: '',
        status: NotificationStatus.FAILED,
        sentAt: new Date(),
      };
    }
  }

  private getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<WhapiErrorResponse>;
      const apiMessage = axiosError.response?.data?.error?.message;
      if (apiMessage) {
        return apiMessage;
      }

      return axiosError.message;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown error';
  }
}

/**
 * Factory function to create WHAPI adapter instance
 */
export function createWhapiAdapter(config: WhapiConfig): WhapiAdapter {
  return new WhapiAdapter(config);
}
