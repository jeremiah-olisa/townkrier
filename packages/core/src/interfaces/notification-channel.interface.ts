import {
  SendEmailRequest,
  SendSmsRequest,
  SendPushRequest,
  SendInAppRequest,
} from './notification-request.interface';
import {
  SendEmailResponse,
  SendSmsResponse,
  SendPushResponse,
  SendInAppResponse,
} from './notification-response.interface';

/**
 * Base interface for notification channels
 */
/**
 * Base interface for notification channels
 */
export interface INotificationChannel<TRequest = any, TResponse = any> {
  /**
   * Send a notification through this channel
   * @param notification - Notification request
   * @returns Promise with notification response
   */
  send(notification: TRequest): Promise<TResponse>;

  /**
   * Get the channel name
   */
  getChannelName(): string;

  /**
   * Get the channel type
   */
  getChannelType(): string;

  /**
   * Check if the channel is properly configured and ready
   */
  isReady(): boolean;
}

/**
 * Email channel interface
 */
export interface IEmailChannel extends INotificationChannel<SendEmailRequest, SendEmailResponse> {
  sendEmail(request: SendEmailRequest): Promise<SendEmailResponse>;
}

/**
 * SMS channel interface
 */
export interface ISmsChannel extends INotificationChannel<SendSmsRequest, SendSmsResponse> {
  sendSms(request: SendSmsRequest): Promise<SendSmsResponse>;
}

/**
 * Push notification channel interface
 */
export interface IPushChannel extends INotificationChannel<SendPushRequest, SendPushResponse> {
  sendPush(request: SendPushRequest): Promise<SendPushResponse>;
}

/**
 * In-app notification channel interface
 */
export interface IInAppChannel extends INotificationChannel<SendInAppRequest, SendInAppResponse> {
  sendInApp(request: SendInAppRequest): Promise<SendInAppResponse>;
}
