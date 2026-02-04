import { Notifiable } from './interfaces/driver.interface';

/**
 * Base abstract class for all Notifications.
 *
 * Extend this class to define your notification logic. You must implement the `via` method
 * to determine which channels to use. You should also define methods like `toEmail`, `toSms`, etc.
 * matching the channel names you return in `via`.
 *
 * @template TChannel - Union type of valid channel names.
 *
 * @example
 * ```typescript
 * class WelcomeUser extends Notification<'email'> {
 *   via(notifiable: Notifiable): 'email'[] {
 *     return ['email'];
 *   }
 *
 *   toEmail(notifiable: Notifiable) {
 *     return { subject: 'Welcome', html: '...' };
 *   }
 * }
 * ```
 */
export abstract class Notification<TChannel extends string = string> {
  /**
   * Determines which channels the notification should be sent through.
   *
   * @param notifiable - The entity receiving the notification.
   * @returns An array of channel names.
   */
  abstract via(notifiable: Notifiable): TChannel[];

  // Note: We don't define abstract toEmail/toSms here because
  // strict typing relies on checking if the method exists at runtime
  // or via interface implementation.
}
