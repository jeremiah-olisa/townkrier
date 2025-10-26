import type { NotificationChannelConfig } from '@townkrier/core';
import type { ServiceAccount } from 'firebase-admin';

/**
 * FCM-specific configuration
 */
export interface FcmConfig extends NotificationChannelConfig {
  /**
   * Firebase service account credentials (JSON)
   */
  serviceAccount?: ServiceAccount;

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
