import { NotificationStatus } from 'townkrier-core';

export interface WhatsAppRequest {
  to: {
    phone: string;
  };
  text: string;
  [key: string]: any;
}

export interface WhatsAppResponse {
  messageId: string;
  status: NotificationStatus;
  sentAt: Date;
  rawResponse?: any;
}
