import { NotificationChannelConfig } from '@townkrier/core';

/**
 * FCM-specific configuration
 */
export interface FcmConfig extends NotificationChannelConfig {
  /**
   * Firebase service account credentials (JSON)
   */
  serviceAccount?: Record<string, unknown>;

  /**
   * Path to service account JSON file
   */
  serviceAccountPath?: string;

  /**
   * Firebase project ID
   */
  projectId?: string;

  /**
   * Firebase database URL
   */
  databaseURL?: string;
}
