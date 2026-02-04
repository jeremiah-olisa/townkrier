# townkrier-core 🚀

A powerful, Laravel-inspired notification system for Node.js. Flexible, provider-agnostic, and built for scalable notification engines.

[![NPM Version](https://img.shields.io/npm/v/townkrier-core.svg)](https://www.npmjs.com/package/townkrier-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🌟 Overview

Townkrier provides a unified API for sending notifications through multiple channels (Email, SMS, Push, WhatsApp, In-App, etc.). It abstracts the complexity of managing multiple providers, allowing you to focus on your application logic rather than API integrations.

Inspired by the elegant Laravel Notification system, Townkrier brings a familiar, developer-friendly experience to the TypeScript ecosystem.

## ✨ Features

- 🔌 **Multi-Channel**: Email, SMS, Push, WhatsApp, In-App (SSE), and custom channels
- 🔄 **Strategy-Driven Delivery**: Built-in support for **Priority Fallback**, **Round Robin**, and **Weighted Random** strategies
- 🎯 **Notifiable Pattern**: Attach notification capabilities to any entity (User, Organization, etc.)
- 🛡️ **Production Ready**: Robust error handling with `BestEffort` or `AllOrNothing` delivery strategies
- 🔁 **Auto-Retry**: Automatic retry with exponential backoff for transient failures
- 📊 **Event System**: Hook into notification lifecycle for logging, analytics, and monitoring
- 🏗️ **Extensible**: Easily build and plug in custom drivers or channels
- 🦾 **Strictly Typed**: Native TypeScript support with deep generic integration for compile-time safety
- 🚀 **Framework Agnostic**: Works with Express, NestJS, Fastify, or standalone

## 📦 Installation

```bash
pnpm add townkrier-core

# Install channel drivers you need
pnpm add townkrier-resend townkrier-termii townkrier-expo
```

---

## 🚀 Quick Start

### 1. Initialize the Manager

Use the `TownkrierFactory` to create your notification manager:

```typescript
import { TownkrierFactory, DeliveryStrategy } from 'townkrier-core';
import { ResendDriver } from 'townkrier-resend';

const manager = TownkrierFactory.create({
  strategy: DeliveryStrategy.BestEffort, // or AllOrNothing
  channels: {
    email: {
      driver: ResendDriver,
      config: { apiKey: process.env.RESEND_API_KEY },
    },
  },
});
```

### 2. Define a Notification

Notifications are classes that define which channels they use and what the message looks like:

```typescript
import { Notification, Notifiable } from 'townkrier-core';
import { ResendMessage } from 'townkrier-resend';

class WelcomeNotification extends Notification<'email'> {
  constructor(private userName: string) {
    super();
  }

  via(notifiable: Notifiable) {
    return ['email'];
  }

  toEmail(notifiable: Notifiable): ResendMessage {
    return {
      subject: 'Welcome to Our Platform!',
      html: `<h1>Welcome ${this.userName}!</h1><p>We're excited to have you on board.</p>`,
      to: notifiable.routeNotificationFor('email') as string,
      from: 'noreply@yourapp.com',
    };
  }
}
```

### 3. Send Notifications

Implement the `Notifiable` interface on your entities:

```typescript
const user = {
  id: 'user_123',
  name: 'Jeremiah',
  email: 'jeremiah@example.com',

  // Required by Notifiable interface
  routeNotificationFor(channel: string) {
    if (channel === 'email') return this.email;
    return undefined;
  },
};

// Send the notification
const result = await manager.send(user, new WelcomeNotification(user.name));
console.log(result.status); // 'success' or 'failed'
```

---

## 🔥 Advanced Usage

### Multi-Channel Notifications

Send notifications across multiple channels simultaneously:

```typescript
import { Notification, Notifiable } from 'townkrier-core';
import { ResendMessage } from 'townkrier-resend';
import { TermiiMessage } from 'townkrier-termii';
import { ExpoMessage } from 'townkrier-expo';

class OrderConfirmation extends Notification<'email' | 'sms' | 'push'> {
  constructor(private orderId: string, private amount: number) {
    super();
  }

  via(notifiable: Notifiable) {
    return ['email', 'sms', 'push'];
  }

  toEmail(notifiable: Notifiable): ResendMessage {
    return {
      subject: `Order #${this.orderId} Confirmed`,
      html: `<p>Your order of $${this.amount} has been confirmed!</p>`,
      to: notifiable.routeNotificationFor('email') as string,
      from: 'orders@yourapp.com',
    };
  }

  toSms(notifiable: Notifiable): TermiiMessage {
    return {
      to: notifiable.routeNotificationFor('sms') as string,
      sms: `Order #${this.orderId} confirmed! Total: $${this.amount}`,
      type: 'plain',
      channel: 'dnd', // Transactional SMS
    };
  }

  toPush(notifiable: Notifiable): ExpoMessage {
    return {
      to: notifiable.routeNotificationFor('push') as string,
      title: 'Order Confirmed',
      body: `Your order #${this.orderId} has been confirmed!`,
      data: { orderId: this.orderId },
    };
  }
}
```

### Strategic Fallbacks & Load Balancing

Configure multiple drivers per channel with advanced strategies:

```typescript
import { TownkrierFactory, FallbackStrategy, DeliveryStrategy } from 'townkrier-core';
import { ResendDriver } from 'townkrier-resend';
import { MailtrapDriver } from 'townkrier-mailtrap';
import { SmtpDriver } from 'townkrier-smtp';
import { TermiiDriver } from 'townkrier-termii';

const manager = TownkrierFactory.create({
  strategy: DeliveryStrategy.BestEffort,
  channels: {
    email: {
      strategy: FallbackStrategy.PriorityFallback, // Try highest priority first
      drivers: [
        {
          use: ResendDriver,
          config: { apiKey: process.env.RESEND_API_KEY },
          priority: 10, // Highest priority
        },
        {
          use: MailtrapDriver,
          config: { token: process.env.MAILTRAP_TOKEN },
          priority: 8,
        },
        {
          use: SmtpDriver,
          config: {
            host: process.env.SMTP_HOST,
            port: 587,
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          priority: 5, // Fallback
        },
      ],
    },
    sms: {
      strategy: FallbackStrategy.RoundRobin, // Distribute load evenly
      drivers: [
        {
          use: TermiiDriver,
          config: {
            apiKey: process.env.TERMII_API_KEY,
            from: process.env.TERMII_SENDER_ID,
          },
        },
      ],
    },
  },
});
```

### Event System

Hook into the notification lifecycle:

```typescript
// Listen to events
manager.events().on('NotificationSending', (event) => {
  console.log(`📤 Sending via: ${event.channels.join(', ')}`);
});

manager.events().on('NotificationSent', (event) => {
  console.log('✅ Notification sent successfully!');
  console.log('Responses:', Object.fromEntries(event.responses));
});

manager.events().on('NotificationFailed', (event) => {
  console.error('❌ Notification failed:', event.error.message);
  // Log to monitoring service
});
```

### Retry Configuration

Customize retry behavior per driver:

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
          retryConfig: {
            maxRetries: 5, // Try 5 times
            retryDelay: 2000, // Start with 2s delay
            exponentialBackoff: true, // Double delay each retry
            maxRetryDelay: 10000, // Cap at 10s
          },
        },
        {
          use: MailtrapDriver,
          config: { token: '...' },
          priority: 8,
          retryConfig: {
            maxRetries: 1, // No retries, fail immediately
          },
        },
      ],
    },
  },
});
```

**Default Retry Behavior:**
- Retries up to 3 times before falling back
- Exponential backoff: 1s → 2s → 4s (capped at 5s)
- Only retries network errors (ETIMEDOUT, ECONNREFUSED, etc.)
- Does not retry API errors (auth failures, rate limits, etc.)

### Disabling Drivers

Temporarily disable drivers without removing them:

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
          enabled: true, // Active
        },
        {
          use: MailtrapDriver,
          config: { token: '...' },
          priority: 8,
          enabled: false, // Disabled for testing
        },
      ],
    },
  },
});
```

---

## 🌐 Framework Integrations

### Express.js

```typescript
import express from 'express';
import { TownkrierFactory } from 'townkrier-core';
import { ResendDriver } from 'townkrier-resend';

const app = express();
app.use(express.json());

// Initialize notification manager
const notificationManager = TownkrierFactory.create({
  channels: {
    email: {
      driver: ResendDriver,
      config: { apiKey: process.env.RESEND_API_KEY },
    },
  },
});

// Make it available in requests
app.use((req, res, next) => {
  req.notifications = notificationManager;
  next();
});

// Use in routes
app.post('/api/users/register', async (req, res) => {
  const user = await createUser(req.body);

  // Send welcome email
  await req.notifications.send(user, new WelcomeNotification(user.name));

  res.json({ success: true, user });
});

app.listen(3000);
```

### NestJS

Create a notification module:

```typescript
// notification.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TownkrierFactory } from 'townkrier-core';
import { ResendDriver } from 'townkrier-resend';
import { TermiiDriver } from 'townkrier-termii';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'NOTIFICATION_MANAGER',
      useFactory: (configService: ConfigService) => {
        return TownkrierFactory.create({
          channels: {
            email: {
              driver: ResendDriver,
              config: { apiKey: configService.get('RESEND_API_KEY') },
            },
            sms: {
              driver: TermiiDriver,
              config: {
                apiKey: configService.get('TERMII_API_KEY'),
                from: configService.get('TERMII_SENDER_ID'),
              },
            },
          },
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: ['NOTIFICATION_MANAGER'],
})
export class NotificationModule {}

// Use in services
import { Injectable, Inject } from '@nestjs/common';
import { NotificationManager } from 'townkrier-core';

@Injectable()
export class UserService {
  constructor(
    @Inject('NOTIFICATION_MANAGER')
    private notifications: NotificationManager,
  ) {}

  async register(data: CreateUserDto) {
    const user = await this.userRepository.create(data);

    // Send welcome notification
    await this.notifications.send(user, new WelcomeNotification(user.name));

    return user;
  }
}
```

### Fastify

```typescript
import Fastify from 'fastify';
import { TownkrierFactory } from 'townkrier-core';
import { ResendDriver } from 'townkrier-resend';

const fastify = Fastify();

// Create notification manager
const notificationManager = TownkrierFactory.create({
  channels: {
    email: {
      driver: ResendDriver,
      config: { apiKey: process.env.RESEND_API_KEY },
    },
  },
});

// Register as decorator
fastify.decorate('notifications', notificationManager);

// Use in routes
fastify.post('/api/users/register', async (request, reply) => {
  const user = await createUser(request.body);

  await fastify.notifications.send(user, new WelcomeNotification(user.name));

  return { success: true, user };
});

fastify.listen({ port: 3000 });
```

---

## 🛠️ Custom Channels & Drivers

Build custom drivers by implementing the `NotificationDriver` interface:

```typescript
import { NotificationDriver, Notifiable, SendResult } from 'townkrier-core';
import axios from 'axios';

interface SlackConfig {
  webhookUrl: string;
}

interface SlackMessage {
  text: string;
  channel?: string;
  username?: string;
}

export class SlackDriver implements NotificationDriver<SlackConfig, SlackMessage> {
  constructor(private config: SlackConfig) {}

  async send(notifiable: Notifiable, message: SlackMessage): Promise<SendResult> {
    try {
      const response = await axios.post(this.config.webhookUrl, {
        text: message.text,
        channel: message.channel,
        username: message.username || 'Notification Bot',
      });

      return {
        id: `slack_${Date.now()}`,
        status: 'success',
        response: response.data,
      };
    } catch (error: any) {
      return {
        id: '',
        status: 'failed',
        error: {
          message: error.message,
          raw: error.response?.data || error,
        },
      };
    }
  }
}

// Register and use
const manager = TownkrierFactory.create({
  channels: {
    slack: {
      driver: SlackDriver,
      config: { webhookUrl: process.env.SLACK_WEBHOOK_URL },
    },
  },
});

class AlertNotification extends Notification<'slack'> {
  via() {
    return ['slack'];
  }

  toSlack(notifiable: Notifiable) {
    return {
      text: '🚨 System Alert: High CPU usage detected!',
      channel: '#alerts',
    };
  }
}
```

---

## 📦 Official Drivers

### Email
- **`townkrier-resend`** - Resend email service
- **`townkrier-mailtrap`** - Mailtrap email testing
- **`townkrier-smtp`** - Generic SMTP driver
- **`townkrier-postmark`** - Postmark email service

### SMS
- **`townkrier-termii`** - Termii SMS service (Nigeria, Africa)

### Push Notifications
- **`townkrier-expo`** - Expo Push Notifications
- **`townkrier-fcm`** - Firebase Cloud Messaging

### WhatsApp
- **`townkrier-whapi`** - Whapi.cloud WhatsApp API
- **`townkrier-wasender`** - WaSender WhatsApp API

### In-App
- **`townkrier-sse`** - Server-Sent Events for real-time notifications

---

## 🎯 Real-World Examples

### OTP Verification

```typescript
class OtpNotification extends Notification<'sms' | 'email'> {
  constructor(private otp: string, private expiresInMinutes: number) {
    super();
  }

  via(notifiable: Notifiable) {
    // Send via SMS if phone exists, otherwise email
    return notifiable.routeNotificationFor('sms') ? ['sms'] : ['email'];
  }

  toSms(notifiable: Notifiable): TermiiMessage {
    return {
      to: notifiable.routeNotificationFor('sms') as string,
      sms: `Your verification code is ${this.otp}. Valid for ${this.expiresInMinutes} minutes.`,
      type: 'plain',
      channel: 'dnd', // Bypass DND for transactional messages
    };
  }

  toEmail(notifiable: Notifiable): ResendMessage {
    return {
      subject: 'Your Verification Code',
      html: `<p>Your verification code is <strong>${this.otp}</strong>. Valid for ${this.expiresInMinutes} minutes.</p>`,
      to: notifiable.routeNotificationFor('email') as string,
      from: 'security@yourapp.com',
    };
  }
}
```

### Payment Confirmation

```typescript
class PaymentConfirmation extends Notification<'email' | 'sms' | 'whatsapp'> {
  constructor(
    private amount: number,
    private currency: string,
    private reference: string,
  ) {
    super();
  }

  via(notifiable: Notifiable) {
    return ['email', 'sms', 'whatsapp'];
  }

  toEmail(notifiable: Notifiable): ResendMessage {
    return {
      subject: 'Payment Received',
      html: `
        <h2>Payment Confirmation</h2>
        <p>We've received your payment of ${this.currency} ${this.amount}</p>
        <p>Reference: ${this.reference}</p>
      `,
      to: notifiable.routeNotificationFor('email') as string,
      from: 'payments@yourapp.com',
    };
  }

  toSms(notifiable: Notifiable): TermiiMessage {
    return {
      to: notifiable.routeNotificationFor('sms') as string,
      sms: `Payment of ${this.currency}${this.amount} received. Ref: ${this.reference}`,
      channel: 'dnd',
    };
  }

  toWhatsapp(notifiable: Notifiable): WhapiMessage {
    return {
      to: notifiable.routeNotificationFor('whatsapp') as string,
      body: `✅ Payment Confirmed!\n\nAmount: ${this.currency} ${this.amount}\nReference: ${this.reference}`,
    };
  }
}
```

---

## 🧪 Testing

Mock the notification manager in tests:

```typescript
import { jest } from '@jest/globals';

const mockNotificationManager = {
  send: jest.fn().mockResolvedValue({
    status: 'success',
    results: new Map([['email', { id: 'test_123', status: 'success' }]]),
    errors: new Map(),
  }),
  events: jest.fn().mockReturnValue({
    on: jest.fn(),
  }),
};

// Use in tests
test('should send welcome notification on user registration', async () => {
  const user = await registerUser({ email: 'test@example.com' });

  expect(mockNotificationManager.send).toHaveBeenCalledWith(
    user,
    expect.any(WelcomeNotification),
  );
});
```

---

## 📊 Best Practices

1. **Use Environment Variables**: Never hardcode API keys
2. **Implement Retry Logic**: Use retry configs for production resilience
3. **Monitor Events**: Hook into events for logging and analytics
4. **Graceful Degradation**: Use `BestEffort` strategy for non-critical notifications
5. **Type Safety**: Always type your notification messages with driver-specific interfaces
6. **Fallback Strategies**: Configure multiple drivers per channel for high availability
7. **Test Notifications**: Use test/sandbox modes in development

---

## 📜 License

MIT © [Jeremiah Olisa](https://github.com/jeremiah-olisa)
