import { NotificationChannelConfig } from '@townkrier/core';

/**
 * Termii-specific configuration
 */
export interface TermiiConfig extends NotificationChannelConfig {
  /**
   * Termii API key
   */
  apiKey: string;

  /**
   * Sender ID (registered with Termii)
   */
  senderId?: string;

  /**
   * Default channel (generic, dnd, or whatsapp)
   */
  channel?: 'generic' | 'dnd' | 'whatsapp';

  /**
   * Base URL for Termii API
   */
  baseUrl?: string;
}
