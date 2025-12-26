import { NotificationChannelConfig } from '@townkrier/core';

/**
 * Mailtrap channel configuration
 */
export interface MailtrapConfig extends NotificationChannelConfig {
  /**
   * Mailtrap API token
   */
  token: string;

  /**
   * Mailtrap endpoint URL (optional, defaults to https://send.api.mailtrap.io/)
   */
  endpoint?: string;

  /**
   * Default from email address
   */
  from?: string;

  /**
   * Default from name
   */
  fromName?: string;
}
