# townkrier-core 🚀

A powerful, Laravel-inspired notification system for Node.js. Flexible, provider-agnostic, and built for building scalable notification engines.

[![NPM Version](https://img.shields.io/npm/v/townkrier-core.svg)](https://www.npmjs.com/package/townkrier-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🌟 Overview

Townkrier provides a unified API for sending notifications through multiple channels (Email, SMS, Push, WhatsApp, etc.). It abstracts the complexity of managing multiple providers, allowing you to focus on your application logic rather than API integrations.

Inspired by the elegant Laravel Notification system, Townkrier brings a familiar, developer-friendly experience to the TypeScript ecosystem.

## ✨ Features

- 🔌 **Channel-Based**: Organise notifications by channels (email, sms, push).
- 🔄 **Strategy-Driven Delivery**: Built-in support for **Priority Fallback**, **Round Robin**, and **Weighted Random** strategies.
- 🎯 **Notifiable Pattern**: Attach notification capabilities to any entity (User, Organization, etc.).
- 🛡️ **Production Ready**: Robust error handling with `BestEffort` or `AllOrNothing` delivery strategies.
- 🏗️ **Extensible**: Easily build and plug in custom drivers or your own unofficial channels.
- 🦾 **Strictly Typed**: Native TypeScript support with deep generic integration for compile-time safety.

## 📦 Installation

```bash
pnpm add townkrier-core
```

---

## 🚀 Basic Usage

### 1. Initialize the Manager

Use the `TownkrierFactory` to create your notification manager. You specify the drivers to use for each channel.

```typescript
import { TownkrierFactory, DeliveryStrategy } from 'townkrier-core';
import { ResendDriver } from 'townkrier-resend';

const manager = TownkrierFactory.create({
  // strategy: DeliveryStrategy.BestEffort, // Default: AllOrNothing
  channels: {
    email: {
      driver: ResendDriver,
      config: { apiKey: 're_123...' },
    },
  },
});
```

### 2. Define a Notification

Notifications are classes that define which channels they use and what the message looks like for each channel.

```typescript
import { Notification, Notifiable } from 'townkrier-core';

class WelcomeNotification extends Notification<'email'> {
  via(notifiable: Notifiable) {
    return ['email'];
  }

  toEmail(notifiable: Notifiable) {
    return {
      subject: 'Welcome to Townkrier!',
      html: `<p>Thanks for joining, ${notifiable.name}!</p>`,
    };
  }
}
```

### 3. Send and Receive

Implement the `Notifiable` interface on your domain entities (Users, Orders, etc.) so Townkrier knows where to send the messages.

```typescript
const user = {
  id: 'user_1',
  name: 'Jeremiah',
  email: 'hello@townkrier.io',

  // Required by Notifiable interface
  routeNotificationFor(driver: string) {
    if (driver === 'email') return this.email;
    return undefined;
  },
};

const result = await manager.send(user, new WelcomeNotification());
console.log(result.status); // 'success'
```

---

## 🔥 Complex Usage (Production Grade)

Townkrier is built for high availability and load balancing across multiple providers.

### Strategic Fallbacks

Configure multiple drivers for a single channel with advanced delivery strategies.

```typescript
import { FallbackStrategy } from 'townkrier-core';
import { ResendDriver } from 'townkrier-resend';
import { MailtrapDriver } from 'townkrier-mailtrap';

const manager = TownkrierFactory.create({
  channels: {
    email: {
      strategy: FallbackStrategy.PriorityFallback, // Try Resend, then Mailtrap
      drivers: [
        { use: ResendDriver, config: { apiKey: '...' }, priority: 10 },
        { use: MailtrapDriver, config: { token: '...' }, priority: 5 }
      ]
    },
    sms: {
      strategy: FallbackStrategy.RoundRobin, // Distribute load evenly
      drivers: [
        { use: ProviderADriver, config: { ... } },
        { use: ProviderBDriver, config: { ... } }
      ]
    }
  }
});
```

### Event System

Listen to the lifecycle of your notifications for logging, analytics, or debugging.

```typescript
// Hook into the event dispatcher
manager.events().on('NotificationSending', (event) => {
  console.log(`📤 Sending via: ${event.channels.join(', ')}`);
});

manager.events().on('NotificationSent', (event) => {
  console.log(`✅ Sent! Results:`, event.responses);
});

manager.events().on('NotificationFailed', (event) => {
  console.error(`❌ Failed:`, event.error.message);
});
```

### Retry Configuration

Townkrier automatically retries failed notifications when network errors occur. This helps handle transient failures like DNS timeouts, connection errors, and temporary API unavailability.

#### Default Retry Behavior

By default, each driver will:
- **Retry up to 3 times** before falling back to the next driver
- Use **exponential backoff**: 1s → 2s → 4s (capped at 5s)
- Only retry on **network errors** (ETIMEDOUT, ECONNREFUSED, ENOTFOUND, etc.)
- **Not retry** on API errors (invalid credentials, rate limits, etc.)

```typescript
// No configuration needed - retry logic is enabled by default
const manager = TownkrierFactory.create({
  channels: {
    email: {
      strategy: FallbackStrategy.PriorityFallback,
      drivers: [
        { use: ResendDriver, config: { apiKey: '...' }, priority: 10 },
        { use: MailtrapDriver, config: { token: '...' }, priority: 5 }
      ]
    }
  }
});
```

#### Custom Retry Configuration

Override retry settings per driver:

```typescript
import { RetryConfig } from 'townkrier-core';

const manager = TownkrierFactory.create({
  channels: {
    email: {
      strategy: FallbackStrategy.PriorityFallback,
      drivers: [
        {
          use: ResendDriver,
          config: { apiKey: '...' },
          priority: 10,
          retryConfig: {
            maxRetries: 5,              // Try 5 times instead of 3
            retryDelay: 2000,            // Start with 2s delay
            exponentialBackoff: true,    // Enable exponential backoff
            maxRetryDelay: 10000,        // Cap delay at 10s
            retryableErrors: ['ETIMEDOUT', 'ECONNREFUSED'] // Custom error codes
          }
        },
        {
          use: MailtrapDriver,
          config: { token: '...' },
          priority: 5,
          retryConfig: {
            maxRetries: 2,               // Only retry twice
            exponentialBackoff: false,   // Use fixed delay
            retryDelay: 1500,            // Always wait 1.5s
          }
        }
      ]
    }
  }
});
```

#### Disable Retries

Set `maxRetries` to 1 to disable retry logic:

```typescript
{
  use: ResendDriver,
  config: { apiKey: '...' },
  priority: 10,
  retryConfig: {
    maxRetries: 1  // No retries, fail immediately
  }
}
```

#### Retry Logging

Retry attempts are automatically logged:

```
2026-02-04T08:50:30.036Z ResendDriver failed (attempt 1/3), retrying in 1000ms
2026-02-04T08:50:31.554Z ResendDriver failed (attempt 2/3), retrying in 2000ms
2026-02-04T08:50:33.789Z ResendDriver succeeded on attempt 3/3

```

### Disabling Drivers

You can disable drivers without removing them from configuration using the `enabled` flag (default: `true`):

```typescript
const manager = TownkrierFactory.create({
  channels: {
    email: {
      strategy: FallbackStrategy.PriorityFallback,
      drivers: [
        {
          use: ResendDriver,
          config: { apiKey: '...' },
          priority: 10,
          enabled: true,  // Active
        },
        {
          use: MailtrapDriver,
          config: { token: '...' },
          priority: 8,
          enabled: false,  // Disabled - will be skipped
        },
        {
          use: SmtpDriver,
          config: { host: '...', port: 587 },
          priority: 6,
          enabled: true,  // Active
        }
      ]
    }
  }
});
```

**Use Cases:**
- Temporarily disable a driver for testing
- Toggle drivers based on environment (e.g., disable production drivers in dev)
- A/B testing different providers
- Feature flags for gradual rollouts

**Behavior:**
- Disabled drivers are filtered out during initialization
- Only enabled drivers are considered for fallback strategy
- At least one driver must be enabled (throws error otherwise)


---

## 🛠️ Custom Channels & Drivers

Building a custom driver is straightforward. Simply implement the `NotificationDriver` interface.

### 1. Create the Driver

```typescript
import { NotificationDriver, Notifiable, SendResult } from 'townkrier-core';

export class TelegramDriver implements NotificationDriver {
  constructor(private config: { botToken: string }) {}

  async send(notifiable: Notifiable, message: any): Promise<SendResult> {
    const chatId = notifiable.routeNotificationFor('telegram');

    // logic to call Telegram Bot API...

    return {
      id: 'tg_msg_882',
      status: 'success',
      response: {
        /* raw response */
      },
    };
  }
}
```

### 2. Register and Use

```typescript
const manager = TownkrierFactory.create({
  channels: {
    telegram: {
      driver: TelegramDriver,
      config: { botToken: '...' },
    },
  },
});

class AlertNotification extends Notification<'telegram'> {
  via() {
    return ['telegram'];
  }

  toTelegram(notifiable: Notifiable) {
    return { text: '🚨 System Alert!' };
  }
}
```

---

## 🏗️ Monorepo Adapters

While `townkrier-core` handles the orchestration, you can install official adapters for popular services:

- `townkrier-resend` - Email via Resend
- `townkrier-termii` - SMS via Termii
- `townkrier-mailtrap` - Email via Mailtrap
- `townkrier-fcm` - Push via Firebase

---

## 📜 License

MIT © [Jeremiah Olisa](https://github.com/jeremiah-olisa)
