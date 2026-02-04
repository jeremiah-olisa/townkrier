/**
 * Defines the global delivery strategy for multi-channel notifications.
 *
 * - `AllOrNothing`: The process stops immediately if any channel fails. All channels must succeed for the notification to be considered successful.
 * - `BestEffort`: The process continues even if some channels fail. It tries to deliver to as many channels as possible.
 */
export enum DeliveryStrategy {
  /**
   * Abort the entire notification process if any single channel fails.
   */
  AllOrNothing = 'all-or-nothing',

  /**
   * Continue sending to other channels even if one fails.
   */
  BestEffort = 'best-effort',
}

/**
 * Represents the final result of a notification attempt across all channels.
 */
export interface NotificationResult {
  /**
   * Overall status of the notification.
   * - `success`: All channels succeeded.
   * - `partial`: Some channels succeeded, some failed (only in BestEffort).
   * - `failed`: All channels failed (or one failed in AllOrNothing).
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
