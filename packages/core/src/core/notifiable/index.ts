import { NotificationManager } from '../notification-manager';
import { NotifiableMixin, INotifiable } from './notifiable-mixin';

export * from './utils';
export * from './notifiable-mixin';

/**
 * Abstract base class for objects that can receive notifications
 *
 * Uses the NotifiableMixin under the hood.
 * Extend this class if you don't already have a base class.
 *
 * @example
 * ```typescript
 * class User extends Notifiable { ... }
 * ```
 */
// Create a dummy base class to apply the mixin to
class BaseNotifiable {}

export abstract class Notifiable extends NotifiableMixin(BaseNotifiable) implements INotifiable {
  /**
   * Constructor for Notifiable
   * @param manager - Optional notification manager to inject
   */
  constructor(manager?: NotificationManager) {
    super();
    this.notificationManager = manager;
  }
}
