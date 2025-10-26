/**
 * In-app notification response from storage
 */
export interface InAppNotificationResponse {
  id: string;
  userId: string;
  title: string;
  message: string;
  type?: string;
  actionUrl?: string;
  icon?: string;
  data?: Record<string, unknown>;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}
