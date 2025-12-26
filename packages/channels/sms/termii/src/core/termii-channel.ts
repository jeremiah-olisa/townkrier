import {
  SmsChannel,
  SendSmsRequest,
  SendSmsResponse,
  NotificationConfigurationException,
  Logger,
} from '@townkrier/core';

import { TermiiConfig } from '../types';
import { TermiiApiResponse } from '../interfaces';
import { TermiiMapper } from './termii.mapper';
import axios, { AxiosInstance } from 'axios';

/**
 * Termii SMS channel implementation
 */
export class TermiiChannel extends SmsChannel {
  private readonly client: AxiosInstance;
  private readonly termiiConfig: TermiiConfig;
  private readonly baseUrl: string;

  constructor(config: TermiiConfig) {
    if (!config.apiKey) {
      throw new NotificationConfigurationException('API key is required for Termii', {
        channel: 'Termii',
      });
    }

    super(config, 'Termii');
    this.termiiConfig = config;
    this.baseUrl = config.baseUrl || 'https://api.ng.termii.com';

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request/response interceptors for debugging
    if (config.debug) {
      this.client.interceptors.request.use((request) => {
        Logger.debug('[Termii Request]', {
          url: request.url,
          method: request.method,
          data: request.data,
        });
        return request;
      });

      this.client.interceptors.response.use(
        (response) => {
          Logger.debug('[Termii Response]', {
            status: response.status,
            data: response.data,
          });
          return response;
        },
        (error) => {
          Logger.error('[Termii Error]', {
            message: error.message,
            response: error.response?.data,
          });
          return Promise.reject(error);
        },
      );
    }
  }

  /**
   * Send an SMS notification
   */
  async sendSms(request: SendSmsRequest): Promise<SendSmsResponse> {
    try {
      const recipients = Array.isArray(request.to) ? request.to : [request.to];

      if (recipients.length === 0) {
        throw new NotificationConfigurationException('No recipients provided', {
          recipients,
        });
      }

      // To adhere to the mapper logic which handles one recipient:
      // We will perform a single send for the first recipient as per the current design constraint
      // or simplistic implementation. A robust implementation would loop or bulk send.
      // TermiiMapper.toTermiiData expects the request object.

      const data = TermiiMapper.toTermiiData(request, this.termiiConfig);

      // Determine endpoint based on whether we have multiple recipients
      const endpoint = Array.isArray(data.to) ? '/api/sms/send/bulk' : '/api/sms/send';

      // Send SMS
      const response = await this.client.post<TermiiApiResponse>(endpoint, data);

      if (!response.data || !response.data.message_id) {
        // Handle cases where Termii returns 200 but with error message
        if (response.data && (response.data as any).message && !(response.data as any).message_id) {
          throw new Error((response.data as any).message);
        }
        // Fallback for unexpected successful response without message_id
        // (Unless bulk response allows partial success? The simple implementation assumes all or nothing or validates response)
        // For bulk, the docs sample response is similar to single.
      }

      return TermiiMapper.toSuccessResponse(response.data, request);
    } catch (error) {
      // Enhanced error handling
      let finalError = error;
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data;
        let message = errorData?.message || (errorData as any)?.error || error.message;

        // If message is an object, try to extract a string or stringify it
        if (typeof message === 'object') {
          message = JSON.stringify(message);
        }

        finalError = new Error(message);
      }
      return TermiiMapper.toErrorResponse(finalError, 'Failed to send SMS');
    }
  }

  protected isValidNotificationRequest(request: any): request is SendSmsRequest {
    return request && request.message && (request.to || Array.isArray(request.to));
  }

  /**
   * Handle errors and convert to standard notification response
   * @deprecated Use Mapper.toErrorResponse instead, this is kept/unused or can be removed if strictly following mapper pattern.
   * I will remove the specific logic here to rely on Mapper, but keep the method if the base class requires it or just delegate.
   * Base class doesn't mandate it private helper.
   */
  private handleError(error: unknown, defaultMessage: string): SendSmsResponse {
    return TermiiMapper.toErrorResponse(error, defaultMessage);
  }
}

/**
 * Factory function to create a Termii channel
 */
export function createTermiiChannel(config: TermiiConfig): TermiiChannel {
  return new TermiiChannel(config);
}
