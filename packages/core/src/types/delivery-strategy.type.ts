/**
 * Delivery strategy for sending notifications
 * - 'all-or-nothing': Fails immediately if any channel fails (default)
 * - 'best-effort': Continues sending to other channels even if one fails
 */
export type DeliveryStrategy = 'all-or-nothing' | 'best-effort';

/**
 * Result of a notification delivery attempt
 */
export interface NotificationResult {
  /**
   * Overall status of the delivery
   * - 'success': All channels succeeded
   * - 'partial': Some channels succeeded, some failed
   * - 'failed': All channels failed (or throw in 'all-or-nothing')
   */
  status: 'success' | 'partial' | 'failed';

  /**
   * Map of channel results (successful responses)
   */
  results: Map<string, unknown>;

  /**
   * Map of channel errors
   */
  errors: Map<string, Error>;
}
