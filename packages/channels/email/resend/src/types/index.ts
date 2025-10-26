import { NotificationChannelConfig } from '@townkrier/core';

/**
 * Resend-specific configuration
 */
export interface ResendConfig extends NotificationChannelConfig {
  /**
   * Resend API key
   */
  apiKey: string;

  /**
   * Default from email address
   */
  from?: string;

  /**
   * Default from name
   */
  fromName?: string;
}
