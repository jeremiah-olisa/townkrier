/**
 * Notification template generator
 * Generates templates for different types of notifications
 */

export interface NotificationTemplateOptions {
  name: string;
  channels: string[];
  withEmail?: boolean;
  withSms?: boolean;
  withPush?: boolean;
  withInApp?: boolean;
}

/**
 * Generate a notification class template
 */
export function generateNotificationTemplate(options: NotificationTemplateOptions): string {
  const { name, channels } = options;

  const className = `${name}Notification`;

  const methods: string[] = [];

  // Add toEmail method if EMAIL channel is included
  if (channels.includes('NotificationChannel.EMAIL') || options.withEmail) {
    methods.push(`  /**
   * Get the email representation of the notification
   */
  toEmail() {
    return {
      subject: 'Your notification subject',
      html: '<h1>Your notification content</h1>',
      text: 'Your notification content',
      // from: { email: 'custom@example.com', name: 'Custom Name' },
      // replyTo: { email: 'reply@example.com', name: 'Reply Name' },
    };
  }`);
  }

  // Add toSms method if SMS channel is included
  if (channels.includes('NotificationChannel.SMS') || options.withSms) {
    methods.push(`  /**
   * Get the SMS representation of the notification
   */
  toSms() {
    return {
      text: 'Your SMS message text',
      // from: 'YourApp',
    };
  }`);
  }

  // Add toPush method if PUSH channel is included
  if (channels.includes('NotificationChannel.PUSH') || options.withPush) {
    methods.push(`  /**
   * Get the push notification representation
   */
  toPush() {
    return {
      title: 'Your notification title',
      body: 'Your notification body',
      // imageUrl: 'https://example.com/image.png',
      // actionUrl: 'https://example.com/action',
      // icon: 'notification-icon.png',
      // sound: 'default',
      // badge: 1,
      // data: { key: 'value' },
    };
  }`);
  }

  // Add toInApp method if IN_APP channel is included
  if (channels.includes('NotificationChannel.IN_APP') || options.withInApp) {
    methods.push(`  /**
   * Get the in-app notification representation
   */
  toInApp() {
    return {
      title: 'Your notification title',
      message: 'Your notification message',
      // type: 'info',
      // actionUrl: '/some/path',
      // icon: 'info-icon',
      // data: { key: 'value' },
    };
  }`);
  }

  const methodsStr = methods.join('\n\n');

  // Build channel array for via() method
  const channelArray = channels.length > 0 ? channels.join(', ') : 'NotificationChannel.EMAIL';

  const template = `import { Notification, NotificationChannel, NotificationPriority } from 'townkrier-core';

/**
 * ${className}
 * 
 * This notification is sent when [describe the event/scenario].
 * 
 * Channels: ${channels.length > 0 ? channels.map((ch) => ch.replace('NotificationChannel.', '')).join(', ') : 'EMAIL'}
 */
export class ${className} extends Notification {
  /**
   * Create a new notification instance
   */
  constructor() {
    super();
    // Set notification priority (URGENT, HIGH, NORMAL, LOW)
    this.priority = NotificationPriority.NORMAL;
  }

  /**
   * Get the notification's delivery channels
   */
  via(): NotificationChannel[] {
    return [${channelArray}];
  }

${methodsStr}
}
`;

  return template;
}

/**
 * Get available notification channels
 */
export function getAvailableChannels(): string[] {
  return [
    'NotificationChannel.EMAIL',
    'NotificationChannel.SMS',
    'NotificationChannel.PUSH',
    'NotificationChannel.IN_APP',
  ];
}
