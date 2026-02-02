# townkrier-core

Laravel-style notification system for Node.js with multiple channels and providers.

## Overview

Townkrier is a flexible, provider-agnostic notification system inspired by Laravel's notification system. It provides a unified API for sending notifications through multiple channels (email, SMS, push notifications, in-app, etc.) with support for multiple providers per channel.

## Features

- 🔌 **Multiple Channels**: Email, SMS, Push Notifications, In-App, Slack, and more
- 🔄 **Provider Agnostic**: Easily switch between providers (Resend, Termii, FCM, etc.)
- ✅ **Type Safe**: Full TypeScript support with comprehensive type definitions
- 🏗️ **Well Structured**: Clean architecture following SOLID principles
- 🔧 **Factory Pattern**: Easy channel registration and management
- 📦 **Standalone Packages**: Each adapter is a separate package
- 🚦 **Fallback Support**: Automatic fallback to alternative channels on failure
- 🎨 **Extensible**: Easy to create custom channels and adapters

## Installation

```bash
npm install townkrier-core
# or
pnpm add townkrier-core
```

## Quick Start

```typescript
import {
  NotificationManager,
  Notification,
  NotificationChannel,
  NotificationPriority,
} from 'townkrier-core';
import { createResendChannel } from 'townkrier-resend';
import { createTermiiChannel } from 'townkrier-termii';

// Initialize notification manager (supports multi-adapter channels)
const manager = new NotificationManager({
  defaultChannel: 'email',
  enableFallback: true,
  strategy: 'best-effort',
  circuitBreaker: {
    enabled: true,
    failureThreshold: 3,
    cooldownMs: 30_000,
  },
  channels: [
    {
      name: 'email',
      enabled: true,
      adapters: [
        {
          name: 'resend',
          priority: 10,
          config: {
            apiKey: process.env.RESEND_API_KEY,
            from: 'noreply@yourdomain.com',
          },
        },
      ],
    },
    {
      name: 'sms',
      enabled: true,
      adapters: [
        {
          name: 'termii',
          priority: 5,
          config: {
            apiKey: process.env.TERMII_API_KEY,
            senderId: 'YourApp',
          },
        },
      ],
    },
  ],
});

// Register adapter factories (use adapter name or "channel-adapter" key)
manager.registerFactory('resend', createResendChannel);
manager.registerFactory('termii', createTermiiChannel);

class WelcomeNotification extends Notification {
  override via() {
    return [NotificationChannel.EMAIL, NotificationChannel.SMS];
  }

  override toEmail() {
    return {
      subject: 'Welcome!',
      text: 'Welcome to our app!',
      html: '<p>Welcome to our app!</p>',
      from: { email: 'noreply@yourdomain.com' },
    };
  }

  override toSms() {
    return { text: 'Welcome to our app!' };
  }
}

const notification = new WelcomeNotification().setPriority(NotificationPriority.NORMAL);

const result = await manager.send(notification, {
  [NotificationChannel.EMAIL]: { email: 'user@example.com', name: 'John Doe' },
  [NotificationChannel.SMS]: { phone: '+15551234567' },
});

console.log(result.status);
```

## Available Adapters

- `townkrier-resend` - Email via Resend
- `townkrier-termii` - SMS via Termii
- `townkrier-fcm` - Push notifications via Firebase Cloud Messaging
- `townkrier-in-app` - In-app notifications with storage interface

## Architecture

The package follows a clean architecture pattern similar to the payment module:

```
townkrier-core
├── interfaces/          # Channel interfaces and contracts
├── types/              # Type definitions and enums
├── core/               # Core classes (Manager, Base classes)
├── channels/           # Base channel implementations
├── exceptions/         # Custom exceptions
└── utils/              # Utility functions

townkrier-adapter-name
├── core/               # Adapter implementation
├── types/              # Adapter-specific types
└── interfaces/         # Adapter-specific interfaces
```

## Creating Custom Channels

```typescript
import {
  MailChannel,
  SendEmailRequest,
  SendEmailResponse,
  NotificationStatus,
} from 'townkrier-core';

export class CustomEmailChannel extends MailChannel {
  constructor(config: CustomConfig) {
    super(config, 'CustomEmail');
  }

  async sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
    // Your implementation here
    return {
      messageId: 'unique-id',
      status: NotificationStatus.SENT,
      sentAt: new Date(),
    };
  }
}
```

## Custom Unofficial Channels (core-only)

If you only install `townkrier-core`, you can build your own unofficial channels (e.g. Telegram, WhatsApp, Mailbox) without extra packages.

```typescript
import {
  BaseNotificationChannel,
  NotificationChannelConfig,
  NotificationManager,
  Notification,
  NotificationStatus,
} from 'townkrier-core';

type TelegramRequest = {
  to: { chatId: string };
  text: string;
  reference?: string;
};

type TelegramResponse = {
  messageId: string;
  status: NotificationStatus;
};

class TelegramChannel extends BaseNotificationChannel<
  NotificationChannelConfig,
  TelegramRequest,
  TelegramResponse
> {
  constructor(config: NotificationChannelConfig) {
    super(config, 'telegram', 'telegram');
  }

  async send(request: TelegramRequest): Promise<TelegramResponse> {
    // Call Telegram API here
    return { messageId: 'tg-123', status: NotificationStatus.SENT };
  }
}

type WhatsAppRequest = {
  to: { phone: string };
  text: string;
  reference?: string;
};

type WhatsAppResponse = {
  messageId: string;
  status: NotificationStatus;
};

class WhatsAppChannel extends BaseNotificationChannel<
  NotificationChannelConfig,
  WhatsAppRequest,
  WhatsAppResponse
> {
  constructor(config: NotificationChannelConfig) {
    super(config, 'whatsapp', 'whatsapp');
  }

  async send(request: WhatsAppRequest): Promise<WhatsAppResponse> {
    // Call WhatsApp API here
    return { messageId: 'wa-123', status: NotificationStatus.SENT };
  }
}

class CustomChatNotification extends Notification {
  override via() {
    return ['telegram', 'whatsapp'];
  }

  toTelegram() {
    return { text: 'Hello from Telegram!' };
  }

  toWhatsapp() {
    return { text: 'Hello from WhatsApp!' };
  }
}

const manager = new NotificationManager({ channels: [] });
manager.registerChannel('telegram', new TelegramChannel({ apiKey: 'token' }));
manager.registerChannel('whatsapp', new WhatsAppChannel({ apiKey: 'token' }));

await manager.send(new CustomChatNotification(), {
  telegram: { chatId: '12345' },
  whatsapp: { phone: '+15551234567' },
});
```

## Manager Configuration

- `channels[].config` is legacy single-adapter configuration.
- Prefer `channels[].adapters` for multi-adapter setup and fallback within a channel.
- Register factories using either the adapter name (e.g. `resend`) or the composite key (`email-resend`).
- Circuit breaker defaults: `enabled=false`, `failureThreshold=3`, `cooldownMs=30000`.

## Circuit Breaker

When enabled, a failing channel won’t block sending to other channels. After a channel hits the failure threshold, its circuit opens for the cooldown window and future sends for that channel are skipped until the cooldown expires.

## Template Rendering

If your `toEmail()` returns a `template`, configure a renderer on the manager:

```typescript
import type { ITemplateRenderer } from 'townkrier-core';

const renderer: ITemplateRenderer = {
  render: async (template, context) => {
    // Return rendered HTML string
    return `<p>${context.name}</p>`;
  },
};

const manager = new NotificationManager({
  renderer,
  channels: [
    /* ... */
  ],
});
```

## Documentation

For detailed documentation, examples, and API reference, visit the [documentation](../../docs).

## License

MIT
