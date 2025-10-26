import type { Notification } from '../notification';
import type { NotificationChannel } from '../../types';
import type { NotificationManager } from '../notification-manager';
import type { NotificationRecipient } from '../../interfaces';
import type { Notifiable } from '.';

/**
 * Helper function to send notifications to a notifiable entity
 * Converts a Notifiable entity to a NotificationRecipient and sends the notification
 *
 * @param notifiable - The entity to notify (must implement Notifiable interface)
 * @param notification - The notification to send
 * @param manager - The notification manager instance
 * @returns Promise that resolves with a Map of channel types to their responses
 *
 * @example
 * ```typescript
 * class User implements Notifiable {
 *   constructor(public email: string, public phone: string) {}
 *
 *   routeNotificationFor(channel: NotificationChannel) {
 *     switch(channel) {
 *       case NotificationChannel.EMAIL: return this.email;
 *       case NotificationChannel.SMS: return this.phone;
 *       default: return this.email;
 *     }
 *   }
 * }
 *
 * const user = new User('user@example.com', '+1234567890');
 * const notification = new WelcomeNotification(user.email);
 * await notify(user, notification, notificationManager);
 * ```
 */
export async function notify(
  notifiable: Notifiable,
  notification: Notification,
  manager: NotificationManager,
): Promise<Map<NotificationChannel, unknown>> {
  // Build recipient object from notifiable entity
  // Get all channels this notification wants to use
  const channels = notification.via();

  // Build the recipient object with routing info for each channel
  const recipient: NotificationRecipient = {} as NotificationRecipient;

  for (const channel of channels) {
    const routingInfo = notifiable.routeNotificationFor(channel);
    if (routingInfo !== undefined && routingInfo !== null) {
      recipient[channel] = routingInfo;
    }
  }

  // Send the notification using the manager
  return await manager.send(notification, recipient);
}
