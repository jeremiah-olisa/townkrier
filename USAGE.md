# Townkrier Notification System

A Laravel-inspired notification system for Node.js/TypeScript with support for multiple channels (Email, SMS, Push, In-App) and providers.

## Features

- 🚀 **Multiple Channels**: Email, SMS, Push Notifications, In-App/Database
- 🔌 **Multiple Providers**: Resend (Email), Termii (SMS), FCM (Push)
- 🔄 **Fallback Support**: Automatic fallback to alternative channels/providers
- 📢 **Event System**: Laravel-style notification events (Sending, Sent, Failed)
- 🎯 **Type-Safe**: Full TypeScript support with strong typing
- 🏗️ **Extensible**: Easy to add custom channels and providers
- ⚙️ **Flexible Configuration**: Priority-based channel selection

## Installation

```bash
# Core package (required)
npm install @townkrier/core

# Channel packages (install as needed)
npm install @townkrier/resend    # Email via Resend
npm install @townkrier/termii    # SMS via Termii
npm install @townkrier/fcm       # Push via Firebase Cloud Messaging
```

## Quick Start

### 1. Setup Notification Manager

```typescript
import { NotificationManager, getEventDispatcher } from '@townkrier/core';
import { createResendChannel } from '@townkrier/resend';
import { createTermiiChannel } from '@townkrier/termii';
import { createFcmChannel } from '@townkrier/fcm';

// Initialize the manager
const manager = new NotificationManager(
  {
    defaultChannel: 'email-resend',
    enableFallback: true,
    channels: [
      {
        name: 'email-resend',
        enabled: true,
        priority: 10,
        config: {
          apiKey: process.env.RESEND_API_KEY,
          from: 'notifications@example.com',
          fromName: 'My App',
        },
      },
      {
        name: 'sms-termii',
        enabled: true,
        priority: 5,
        config: {
          apiKey: process.env.TERMII_API_KEY,
          senderId: 'MyApp',
        },
      },
      {
        name: 'push-fcm',
        enabled: true,
        priority: 3,
        config: {
          serviceAccount: JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}'),
          projectId: process.env.FIREBASE_PROJECT_ID,
        },
      },
    ],
  },
  getEventDispatcher(), // Optional: for event support
);

// Register channel factories
manager.registerFactory('email-resend', createResendChannel);
manager.registerFactory('sms-termii', createTermiiChannel);
manager.registerFactory('push-fcm', createFcmChannel);
```

### 2. Create a Notification

```typescript
import { Notification, NotificationChannel, NotificationPriority } from '@townkrier/core';

class WelcomeNotification extends Notification {
  constructor(private userName: string) {
    super();
    this.priority = NotificationPriority.HIGH;
  }

  // Define which channels to use
  via(): NotificationChannel[] {
    return [NotificationChannel.EMAIL, NotificationChannel.SMS];
  }

  // Email format
  toEmail() {
    return {
      subject: `Welcome ${this.userName}!`,
      html: `<h1>Welcome to our platform, ${this.userName}!</h1>`,
      text: `Welcome to our platform, ${this.userName}!`,
    };
  }

  // SMS format
  toSms() {
    return {
      text: `Welcome ${this.userName}! Thanks for joining us.`,
    };
  }

  // Push notification format (optional)
  toPush() {
    return {
      title: 'Welcome!',
      body: `Hi ${this.userName}, welcome to our platform!`,
      icon: 'welcome-icon.png',
    };
  }

  // In-app notification format (optional)
  toInApp() {
    return {
      title: 'Welcome!',
      message: `Hi ${this.userName}, welcome to our platform!`,
      type: 'welcome',
    };
  }
}
```

### 3. Send a Notification

```typescript
// Create notification
const notification = new WelcomeNotification('John Doe');

// Define recipient routing info
const recipient = {
  [NotificationChannel.EMAIL]: { email: 'john@example.com', name: 'John Doe' },
  [NotificationChannel.SMS]: { phone: '+1234567890' },
  [NotificationChannel.PUSH]: { deviceToken: 'fcm-device-token-here' },
  [NotificationChannel.IN_APP]: { userId: 'user-123' },
};

// Send notification
try {
  const responses = await manager.send(notification, recipient);

  // Check responses
  for (const [channel, response] of responses) {
    console.log(`${channel}:`, response.success ? 'Sent' : 'Failed');
  }
} catch (error) {
  console.error('Notification failed:', error);
}
```

## Using Individual Channels

You can also use channels directly without the manager:

```typescript
import { createResendChannel } from '@townkrier/resend';

const emailChannel = createResendChannel({
  apiKey: process.env.RESEND_API_KEY,
  from: 'notifications@example.com',
  fromName: 'My App',
});

const response = await emailChannel.sendEmail({
  to: { email: 'user@example.com', name: 'User' },
  subject: 'Hello',
  html: '<p>Hello World!</p>',
  text: 'Hello World!',
  message: 'Hello World!',
});

console.log('Email sent:', response.messageId);
```

## Notification Events

Listen to notification lifecycle events (similar to Laravel):

```typescript
import {
  getEventDispatcher,
  NotificationSending,
  NotificationSent,
  NotificationFailed,
} from '@townkrier/core';

const dispatcher = getEventDispatcher();

// Before sending
dispatcher.on(NotificationSending, async (event) => {
  console.log('Sending notification via:', event.channels);
  // Log to database, analytics, etc.
});

// After successful send
dispatcher.on(NotificationSent, async (event) => {
  console.log('Notification sent successfully!');
  // Update user preferences, send analytics, etc.
});

// On failure
dispatcher.on(NotificationFailed, async (event) => {
  console.error('Notification failed:', event.error);
  console.error('Failed channel:', event.failedChannel);
  // Log error, alert admins, etc.
});
```

## Fallback Strategy

Enable fallback to automatically try alternative channels when one fails:

```typescript
const manager = new NotificationManager({
  defaultChannel: 'email-resend',
  enableFallback: true, // Enable fallback
  channels: [
    {
      name: 'email-primary',
      enabled: true,
      priority: 10, // Higher priority = tried first
      config: {
        /* ... */
      },
    },
    {
      name: 'email-backup',
      enabled: true,
      priority: 5, // Lower priority = fallback
      config: {
        /* ... */
      },
    },
  ],
});

// If email-primary fails, automatically tries email-backup
const channel = manager.getChannelWithFallback('email-primary');
```

## Using the Notifiable Interface

Implement the `Notifiable` interface on your user/entity models:

```typescript
import { Notifiable, NotificationChannel } from '@townkrier/core';

class User implements Notifiable {
  constructor(
    public id: string,
    public name: string,
    public email: string,
    public phone?: string,
    public deviceTokens?: string[],
  ) {}

  // Define routing for each channel
  routeNotificationFor(channel: NotificationChannel): unknown {
    switch (channel) {
      case NotificationChannel.EMAIL:
        return { email: this.email, name: this.name };
      case NotificationChannel.SMS:
        return this.phone ? { phone: this.phone } : null;
      case NotificationChannel.PUSH:
        return this.deviceTokens?.map((token) => ({ deviceToken: token }));
      case NotificationChannel.IN_APP:
        return { userId: this.id, email: this.email };
      default:
        return null;
    }
  }

  getNotificationName(): string {
    return this.name;
  }
}

// Usage
const user = new User('123', 'John Doe', 'john@example.com', '+1234567890');
const notification = new WelcomeNotification(user.name);

// Build recipient routing info from user
const recipient = notification.via().reduce((acc, channel) => {
  const route = user.routeNotificationFor(channel);
  if (route) acc[channel] = route;
  return acc;
}, {} as NotificationRecipient);

await manager.send(notification, recipient);
```

## Localization Support (Future)

The system is designed with localization in mind. Future updates will support:

```typescript
class WelcomeNotification extends Notification {
  constructor(
    private userName: string,
    private locale: string = 'en',
  ) {
    super();
  }

  toEmail() {
    // Will support translation files
    return {
      subject: translate('notifications.welcome.subject', { name: this.userName }, this.locale),
      html: translate('notifications.welcome.body', { name: this.userName }, this.locale),
    };
  }
}
```

## Configuration Examples

### Environment Variables

```env
# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=notifications@example.com
RESEND_FROM_NAME=My App

# SMS (Termii)
TERMII_API_KEY=TLxxxxxxxxxxxxxxxxx
TERMII_SENDER_ID=MyApp

# Push (FCM)
FIREBASE_PROJECT_ID=my-project-id
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

### TypeScript Configuration

Ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "commonjs",
    "lib": ["ES2021"],
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

## Available Channels

### Email

- **@townkrier/resend** - Email via [Resend](https://resend.com)
  - Transactional emails
  - Template support
  - Attachment support

### SMS

- **@townkrier/termii** - SMS via [Termii](https://termii.com)
  - International SMS
  - Sender ID support
  - Cost tracking

### Push Notifications

- **@townkrier/fcm** - Push via [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
  - iOS, Android, Web push
  - Rich notifications
  - Topic/token support

### Database/In-App (Coming Soon)

- Prisma adapter
- Database storage
- Read/unread tracking
- In-app notification UI

## Creating Custom Channels

Extend the base channel classes to create your own providers:

```typescript
import {
  MailChannel,
  SendEmailRequest,
  SendEmailResponse,
  NotificationStatus,
} from '@townkrier/core';

class CustomEmailChannel extends MailChannel {
  constructor(config: CustomEmailConfig) {
    super(config, 'CustomEmail');
  }

  async sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
    // Your custom implementation
    const response = await yourEmailService.send(request);

    return {
      success: true,
      messageId: response.id,
      status: NotificationStatus.SENT,
      sentAt: new Date(),
    };
  }
}

export function createCustomEmailChannel(config: CustomEmailConfig): CustomEmailChannel {
  return new CustomEmailChannel(config);
}
```

## Best Practices

1. **Use environment-specific configs**: Different API keys for dev/staging/production
2. **Enable fallbacks**: Always have backup channels configured
3. **Listen to events**: Log notification attempts for debugging and analytics
4. **Implement Notifiable**: Keep routing logic in your models/entities
5. **Handle errors gracefully**: Don't let notification failures break your app
6. **Rate limiting**: Be mindful of provider rate limits
7. **Queue notifications**: Use a job queue for high-volume scenarios

## Testing

```typescript
import { NotificationManager } from '@townkrier/core';

// Use test mode or mock configurations
const testManager = new NotificationManager({
  defaultChannel: 'email-test',
  enableFallback: false,
  channels: [
    {
      name: 'email-test',
      enabled: true,
      config: {
        apiKey: 'test-key',
        debug: true, // Enable debug logging
      },
    },
  ],
});

// Register mock channel for testing
manager.registerChannel('email-test', mockEmailChannel);
```

## Roadmap

- [x] Core notification system
- [x] Email channel (Resend)
- [x] SMS channel (Termii)
- [x] Push channel (FCM)
- [x] Notification events
- [ ] Database/In-App channel
- [ ] Localization support
- [ ] More email providers (Postmark, etc.)
- [ ] More SMS providers (Twilio, etc.)
- [ ] More push providers (APNs, OneSignal, etc.)
- [ ] Webhook notifications
- [ ] Batch notifications
- [ ] Scheduled notifications
- [ ] Rate limiting
- [ ] Queue integration

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines.

## Credits

Inspired by [Laravel Notifications](https://laravel.com/docs/notifications)
