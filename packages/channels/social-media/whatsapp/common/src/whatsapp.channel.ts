import { BaseNotificationChannel, NotificationChannelConfig } from 'townkrier-core';
import { WhatsAppRequest, WhatsAppResponse } from './interfaces';

export abstract class WhatsAppChannel extends BaseNotificationChannel<
  NotificationChannelConfig,
  WhatsAppRequest,
  WhatsAppResponse
> {
  constructor(config: NotificationChannelConfig, channelName: string) {
    super(config, channelName, 'whatsapp');
  }

  abstract send(request: WhatsAppRequest): Promise<WhatsAppResponse>;

  protected isValidNotificationRequest(request: any): request is WhatsAppRequest {
    return !!request && !!request.to && !!request.to.phone && !!request.text;
  }
}
