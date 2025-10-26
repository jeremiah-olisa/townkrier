import { Notification } from './notification';
import { NotificationChannel } from '../types';

/**
 * Interface for objects that can receive notifications (users, etc.)
 */
export interface Notifiable {
  /**
   * Get the notification routing information for the given channel
   * @param channel - The notification channel
   */
  routeNotificationFor(channel: NotificationChannel): string | string[] | unknown;

  /**
   * Get the preferred name for notifications
   */
  getNotificationName?(): string;
}

/**
 * Helper function to send notifications to a notifiable entity
 * @param notifiable - The entity to notify
 * @param notification - The notification to send
 * @param manager - The notification manager instance
 */
export async function notify(
  notifiable: Notifiable,
  notification: Notification,
  manager: unknown,
): Promise<void> {
  // This is a placeholder for the actual notification sending logic
  // The actual implementation would be in a service that uses the notification manager
  console.log('Notifying:', notifiable, notification, manager);
  throw new Error('Not implemented - use NotificationService or NotificationManager instead');
}
