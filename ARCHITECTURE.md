# Architecture Summary

This document explains how the Townkrier notification system architecture follows the payment gateway pattern requested in the requirements.

## System Architecture

### Core Pattern: Manager + Adapters (Channels)

The system follows the same factory pattern as the payment gateway example, but for notifications:

```typescript
// Payment Gateway Pattern (from requirements)
PaymentGatewayManager
  ├── registerFactory()
  ├── registerGateway()
  ├── getGateway()
  ├── getDefaultGateway()
  └── getGatewayWithFallback()

// Notification Pattern (implemented)
NotificationManager
  ├── registerFactory()
  ├── registerChannel()
  ├── getChannel()
  ├── getDefaultChannel()
  └── getChannelWithFallback()
```

## Key Components

### 1. Base Classes (Like BasePaymentGateway)

```
BaseNotificationChannel (abstract)
  ├── validateConfig()
  ├── getChannelName()
  ├── getChannelType()
  ├── isReady()
  └── send() (abstract)
```

**Specific Channel Types:**

- `MailChannel` - Base for email channels (Resend, Postmark, etc.)
- `SmsChannel` - Base for SMS channels (Termii, Twilio, etc.)
- `PushChannel` - Base for push notifications (FCM, APNs, etc.)
- `InAppChannel` - Base for in-app/database notifications

### 2. Manager Class (Like PaymentGatewayManager)

```typescript
class NotificationManager {
  // Registry of channels and factories
  private readonly channels: Map<string, INotificationChannel>
  private readonly factories: Map<string, ChannelFactory>
  private readonly channelConfigs: Map<string, ChannelConfig>

  // Configuration
  private defaultChannel?: string
  private enableFallback: boolean

  // Event dispatcher (bonus feature)
  private eventDispatcher?: NotificationEventDispatcher

  // Core methods (matching payment gateway pattern)
  registerFactory<T>(name: string, factory: ChannelFactory<T>): this
  registerChannel(name: string, channel: INotificationChannel): this
  getChannel(name: string): INotificationChannel
  getDefaultChannel(): INotificationChannel
  getChannelWithFallback(preferredChannel?: string): INotificationChannel | null
  getAvailableChannels(): string[]
  getReadyChannels(): string[]
  hasChannel(name: string): boolean
  isChannelReady(name: string): boolean
  setDefaultChannel(name: string): this
  setFallbackEnabled(enabled: boolean): this
  removeChannel(name: string): this
  clear(): this

  // Additional notification-specific methods
  send(notification: Notification, recipient: Record<...>): Promise<...>
  setEventDispatcher(dispatcher: NotificationEventDispatcher): this
}
```

### 3. Configuration (Like PaymentGatewayManagerConfig)

```typescript
interface NotificationManagerConfig {
  defaultChannel?: string;
  enableFallback?: boolean;
  channels: ChannelConfig[];
}

interface ChannelConfig {
  name: string;
  enabled?: boolean;
  priority?: number; // For fallback ordering
  config: ChannelEnvConfig;
}
```

## Usage Comparison

### Payment Gateway Example (from requirements)

```typescript
const paymentManager = new PaymentGatewayManager({
  defaultGateway: 'paystack',
  enableFallback: true,
  gateways: [
    {
      name: 'paystack',
      enabled: true,
      priority: 10,
      config: { secretKey: '...' },
    },
  ],
});

paymentManager.registerFactory('paystack', createPaystackGateway);
const gateway = paymentManager.getGateway('paystack');
await gateway.initiatePayment(request);
```

### Notification Implementation (as built)

```typescript
const notificationManager = new NotificationManager({
  defaultChannel: 'email-resend',
  enableFallback: true,
  channels: [
    {
      name: 'email-resend',
      enabled: true,
      priority: 10,
      config: { apiKey: '...' },
    },
  ],
});

notificationManager.registerFactory('email-resend', createResendChannel);
const channel = notificationManager.getChannel('email-resend');
await channel.send(request);
```

## Advanced Features

### 1. Fallback Strategy (Matching Payment Gateway)

```typescript
// Try preferred, then default, then any available
const channel = manager.getChannelWithFallback('email-primary');
```

**Priority-based fallback:**

```typescript
channels: [
  { name: 'email-primary', priority: 10 }, // Try first
  { name: 'email-backup', priority: 5 }, // Try second
  { name: 'sms-fallback', priority: 1 }, // Last resort
];
```

### 2. Multiple Adapter Registration

```typescript
// Email providers
manager.registerFactory('email-resend', createResendChannel);
manager.registerFactory('email-postmark', createPostmarkChannel);

// SMS providers
manager.registerFactory('sms-termii', createTermiiChannel);
manager.registerFactory('sms-twilio', createTwilioChannel);

// Push providers
manager.registerFactory('push-fcm', createFcmChannel);
manager.registerFactory('push-apns', createApnsChannel);
```

### 3. Notification Events (Laravel-inspired)

Bonus feature not in payment gateway but requested for notifications:

```typescript
const dispatcher = getEventDispatcher();

dispatcher.on(NotificationSending, (event) => {
  // Before sending
});

dispatcher.on(NotificationSent, (event) => {
  // After success
});

dispatcher.on(NotificationFailed, (event) => {
  // On failure
});
```

## MVP Channels Implemented

### Email: Resend

```typescript
class ResendChannel extends MailChannel {
  async sendEmail(request: SendEmailRequest): Promise<SendEmailResponse>;
}
```

### SMS: Termii

```typescript
class TermiiChannel extends SmsChannel {
  async sendSms(request: SendSmsRequest): Promise<SendSmsResponse>;
}
```

### Push: Firebase Cloud Messaging

```typescript
class FcmChannel extends PushChannel {
  async sendPush(request: SendPushRequest): Promise<SendPushResponse>;
}
```

### Database/In-App: Base Ready

```typescript
class InAppChannel extends BaseNotificationChannel {
  async sendInApp(request: SendInAppRequest): Promise<SendInAppResponse>;
}
```

## Directory Structure

```
packages/
├── core/
│   ├── src/
│   │   ├── core/
│   │   │   ├── notification-manager.ts      ← Manager (like PaymentGatewayManager)
│   │   │   ├── base-notification-channel.ts ← Base (like BasePaymentGateway)
│   │   │   ├── notification.ts              ← Notification class
│   │   │   ├── notifiable.ts                ← Interface for entities
│   │   │   └── notification-events.ts       ← Event system
│   │   ├── channels/
│   │   │   ├── mail.channel.ts              ← MailChannel base
│   │   │   ├── sms.channel.ts               ← SmsChannel base
│   │   │   ├── push.channel.ts              ← PushChannel base
│   │   │   └── in-app.channel.ts            ← InAppChannel base
│   │   ├── interfaces/
│   │   │   ├── notification-channel.interface.ts
│   │   │   ├── notification-config.interface.ts
│   │   │   ├── notification-request.interface.ts
│   │   │   └── notification-response.interface.ts
│   │   ├── types/
│   │   ├── utils/
│   │   └── exceptions/
│
├── resend/                  ← Email adapter (like PaystackGateway)
│   └── src/
│       └── core/
│           └── resend-channel.ts
│
└── channels/
    ├── sms/
    │   └── termii/         ← SMS adapter
    │       └── src/
    │           └── core/
    │               └── termii-channel.ts
    │
    └── push/
        └── fcm/            ← Push adapter
            └── src/
                └── core/
                    └── fcm-channel.ts
```

## Configuration Example

```typescript
// Environment-based configuration
const config: NotificationManagerConfig = {
  defaultChannel: process.env.DEFAULT_NOTIFICATION_CHANNEL || 'email-resend',
  enableFallback: process.env.ENABLE_FALLBACK === 'true',
  channels: [
    {
      name: 'email-resend',
      enabled: process.env.RESEND_ENABLED !== 'false',
      priority: 10,
      config: {
        apiKey: process.env.RESEND_API_KEY,
        from: process.env.RESEND_FROM_EMAIL,
        fromName: process.env.RESEND_FROM_NAME,
      },
    },
    {
      name: 'sms-termii',
      enabled: process.env.TERMII_ENABLED !== 'false',
      priority: 5,
      config: {
        apiKey: process.env.TERMII_API_KEY,
        senderId: process.env.TERMII_SENDER_ID,
      },
    },
    {
      name: 'push-fcm',
      enabled: process.env.FCM_ENABLED !== 'false',
      priority: 3,
      config: {
        serviceAccount: JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}'),
        projectId: process.env.FIREBASE_PROJECT_ID,
      },
    },
  ],
};
```

## Type Safety

All methods are fully typed:

```typescript
// Type-safe channel operations
const channel: INotificationChannel = manager.getChannel('email-resend');
const response: SendEmailResponse = await channel.send(emailRequest);

// Type-safe configuration
const config: NotificationManagerConfig = { ... };

// Type-safe notification creation
class MyNotification extends Notification {
  via(): NotificationChannel[] { ... }
  toEmail(): EmailNotificationData { ... }
  toSms(): SmsNotificationData { ... }
}
```

## Extensibility

Adding new channels is straightforward:

```typescript
// 1. Create channel class extending appropriate base
class PostmarkChannel extends MailChannel {
  async sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
    // Implementation
  }
}

// 2. Create factory function
export function createPostmarkChannel(config: PostmarkConfig): PostmarkChannel {
  return new PostmarkChannel(config);
}

// 3. Register with manager
manager.registerFactory('email-postmark', createPostmarkChannel);
```

## Summary

The Townkrier notification system exactly follows the payment gateway pattern from the requirements:

✅ **Manager Pattern**: NotificationManager manages multiple adapters
✅ **Base Classes**: BaseNotificationChannel and specific channel types
✅ **Factory Registration**: registerFactory() for channel creation
✅ **Multiple Adapters**: Support for multiple providers per channel type
✅ **Fallback Support**: Priority-based automatic fallback
✅ **Configuration**: Flexible, environment-based configuration
✅ **Type Safety**: Full TypeScript support
✅ **Events**: Laravel-style notification events (bonus feature)

The code structure, naming conventions, and architectural patterns directly mirror the payment gateway example while being adapted for the notification domain.
