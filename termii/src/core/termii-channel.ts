import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  SmsChannel,
  SendSmsRequest,
  SendSmsResponse,
  NotificationStatus,
  NotificationConfigurationException,
  NotificationProviderException,
  NotificationInvalidResponseError,
  generateReference,
  isValidPhone,
  normalizePhone,
  sanitizeMetadata,
} from '@townkrier/core';

import { TermiiConfig } from '../types';
import { TermiiSmsData, TermiiApiResponse, TermiiError } from '../interfaces';

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
        console.log('[Termii Request]', {
          url: request.url,
          method: request.method,
          data: request.data,
        });
        return request;
      });

      this.client.interceptors.response.use(
        (response) => {
          console.log('[Termii Response]', {
            status: response.status,
            data: response.data,
          });
          return response;
        },
        (error) => {
          console.error('[Termii Error]', {
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
      // Validate recipients
      const recipients = Array.isArray(request.to) ? request.to : [request.to];
      const validRecipients = recipients.filter((r) => {
        if (!isValidPhone(r.phone)) {
          console.warn(`Invalid phone number skipped: ${r.phone}`);
          return false;
        }
        return true;
      });

      if (validRecipients.length === 0) {
        throw new NotificationConfigurationException('No valid phone numbers provided', {
          recipients,
        });
      }

      // Termii sends one message at a time, so we'll send to the first recipient
      // For multiple recipients, you'd need to make multiple API calls
      const recipient = validRecipients[0];
      const normalizedPhone = normalizePhone(recipient.phone);

      // Prepare SMS data
      const from = request.from || this.termiiConfig.senderId || 'Townkrier';
      const channel = this.termiiConfig.channel || 'generic';

      const smsData: TermiiSmsData = {
        api_key: this.termiiConfig.apiKey,
        to: normalizedPhone,
        from,
        sms: request.text,
        type: 'plain',
        channel,
      };

      // Send SMS
      const response = await this.client.post<TermiiApiResponse>('/api/sms/send', smsData);

      if (!response.data || !response.data.message_id) {
        throw new NotificationInvalidResponseError(
          response.data?.message || 'No response data from Termii',
          response.status,
          response.data,
        );
      }

      const data = response.data;
      const reference = request.reference || generateReference('SMS');

      return {
        success: true,
        messageId: data.message_id,
        reference,
        status: NotificationStatus.SENT,
        sentAt: new Date(),
        units: 1, // Termii charges per message
        metadata: sanitizeMetadata(request.metadata),
        raw: response.data,
      };
    } catch (error) {
      return this.handleError(error, 'Failed to send SMS') as SendSmsResponse;
    }
  }

  /**
   * Handle errors and convert to standard notification response
   */
  private handleError(error: unknown, defaultMessage: string): SendSmsResponse {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<TermiiError>;
      const message = axiosError.response?.data?.message || axiosError.message || defaultMessage;
      const statusCode = axiosError.response?.status;

      // Check for timeout
      if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
        return {
          success: false,
          messageId: '',
          status: NotificationStatus.FAILED,
          error: {
            code: 'TERMII_TIMEOUT',
            message: 'Termii API request timed out',
            details: {
              statusCode,
              response: axiosError.response?.data,
            },
          },
        };
      }

      return {
        success: false,
        messageId: '',
        status: NotificationStatus.FAILED,
        error: {
          code: 'TERMII_ERROR',
          message,
          details: {
            statusCode,
            response: axiosError.response?.data,
          },
        },
      };
    }

    // Handle notification exceptions from core
    if (error instanceof Error && error.name && error.name.includes('Exception')) {
      const notificationError = error as Error & { code?: string; details?: unknown };
      return {
        success: false,
        messageId: '',
        status: NotificationStatus.FAILED,
        error: {
          code: notificationError.code || 'NOTIFICATION_ERROR',
          message: error.message || defaultMessage,
          details: notificationError.details,
        },
      };
    }

    return {
      success: false,
      messageId: '',
      status: NotificationStatus.FAILED,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : defaultMessage,
        details: error,
      },
    };
  }
}

/**
 * Factory function to create a Termii channel
 */
export function createTermiiChannel(config: TermiiConfig): TermiiChannel {
  return new TermiiChannel(config);
}
