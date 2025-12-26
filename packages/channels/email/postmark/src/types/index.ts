import { NotificationChannelConfig } from '@townkrier/core';

export interface PostmarkConfig extends NotificationChannelConfig {
  /**
   * Postmark Server API Token
   */
  serverToken: string;

  /**
   * Default from email address
   */
  from?: string;
}
