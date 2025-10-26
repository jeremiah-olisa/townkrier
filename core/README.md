# @townkrier/core

Laravel-style notification system for Node.js with multiple channels and providers.

## Overview

Townkrier is a flexible, provider-agnostic notification system inspired by Laravel's notification system. It provides a unified API for sending notifications through multiple channels (email, SMS, push notifications, in-app, etc.) with support for multiple providers per channel.

## Features

- 🔌 **Multiple Channels**: Email, SMS, Push Notifications, In-App, Slack, and more
- 🔄 **Provider Agnostic**: Easily switch between providers (Resend, Termii, FCM, etc.)
- �� **Type Safe**: Full TypeScript support with comprehensive type definitions
- 🏗️ **Well Structured**: Clean architecture following SOLID principles
- 🔧 **Factory Pattern**: Easy channel registration and management
- 📦 **Standalone Packages**: Each adapter is a separate package
- 🚦 **Fallback Support**: Automatic fallback to alternative channels on failure
- 🎨 **Extensible**: Easy to create custom channels and adapters

## Installation

```bash
npm install @townkrier/core
# or
pnpm add @townkrier/core
```

## Quick Start

```typescript
import { NotificationManager } from '@townkrier/core';
import { createResendChannel } from '@townkrier/resend';
import { createTermiiChannel } from '@townkrier/termii';

// Initialize notification manager
const manager = new NotificationManager({
  defaultChannel: 'email',
  enableFallback: true,
  channels: [
    {
      name: 'email',
      enabled: true,
      priority: 1,
      config: {
        apiKey: process.env.RESEND_API_KEY,
        from: 'noreply@yourdomain.com',
      },
    },
    {
      name: 'sms',
      enabled: true,
      priority: 2,
      config: {
        apiKey: process.env.TERMII_API_KEY,
        senderId: 'YourApp',
      },
    },
  ],
});

// Register channel factories
manager.registerFactory('email', createResendChannel);
manager.registerFactory('sms', createTermiiChannel);

// Send notification
const channel = manager.getChannel('email');
await channel.send({
  from: { email: 'noreply@yourdomain.com' },
  to: { email: 'user@example.com', name: 'John Doe' },
  subject: 'Welcome!',
  html: '<p>Welcome to our app!</p>',
  text: 'Welcome to our app!',
});
```

## Available Adapters

- `@townkrier/resend` - Email via Resend
- `@townkrier/termii` - SMS via Termii
- `@townkrier/fcm` - Push notifications via Firebase Cloud Messaging
- `@townkrier/in-app` - In-app notifications with storage interface

## Architecture

The package follows a clean architecture pattern similar to the payment module:

```
@townkrier/core
├── interfaces/          # Channel interfaces and contracts
├── types/              # Type definitions and enums
├── core/               # Core classes (Manager, Base classes)
├── channels/           # Base channel implementations
├── exceptions/         # Custom exceptions
└── utils/              # Utility functions

@townkrier/adapter-name
├── core/               # Adapter implementation
├── types/              # Adapter-specific types
└── interfaces/         # Adapter-specific interfaces
```

## Creating Custom Channels

```typescript
import { MailChannel, SendEmailRequest, SendEmailResponse } from '@townkrier/core';

export class CustomEmailChannel extends MailChannel {
  constructor(config: CustomConfig) {
    super(config, 'CustomEmail');
  }

  async sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
    // Your implementation here
    return {
      success: true,
      messageId: 'unique-id',
      status: 'sent',
      sentAt: new Date(),
    };
  }
}
```

## Documentation

For detailed documentation, examples, and API reference, visit the [documentation](../../docs).

## License

MIT
