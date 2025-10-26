import { Notification } from './notification';
import { NotificationChannel } from '../types';
export interface Notifiable {
    routeNotificationFor(channel: NotificationChannel): string | string[] | unknown;
    getNotificationName?(): string;
}
export declare function notify(notifiable: Notifiable, notification: Notification, manager: unknown): Promise<void>;
//# sourceMappingURL=notifiable.d.ts.map