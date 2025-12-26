import { NotificationChannelConfig } from '@townkrier/core';

export interface SmtpConfig extends NotificationChannelConfig {
  host: string;
  port: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  from?: string;
  fromName?: string;
}
