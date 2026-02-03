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
