# Townkrier v2: DX & Architecture Proposal

**Goal**: Redesign the Townkrier package to prioritize "Configuration over Boilerplate," inspired by Laravel Notifications and .NET Dependency Injection patterns. The target experience is seamless setup, automatic driver discovery, and robust fallback support without manual wiring.

---

## 1. Setup Experience (The "One-Liner")

Users should not need to write `FactoryRegistry` or `Factory` classes manually. Setup happens configuration, either via NestJS Module or a standalone Factory.

### A. NestJS Configuration (Module)

Support for primary drivers and unlimited backup chains defined directly in the config.

```typescript
// app.module.ts
import { TownkrierModule } from 'townkrier';
import { ResendDriver } from 'townkrier-resend';
import { TermiiDriver } from 'townkrier-termii';
import { SlackDriver } from './custom-drivers/slack.driver';

@Module({
  imports: [
    TownkrierModule.forRoot({
      defaultChannel: 'email',
      channels: {
        // CHANNEL WITH BACKUPS (Strategy pattern built-in)
        email: {
          strategy: 'priority-fallback',
          drivers: [
            {
              use: ResendDriver,
              options: { apiKey: process.env.RESEND_API_KEY },
            },
            {
              use: MailtrapDriver,
              options: { apiKey: process.env.MAILTRAP_API_KEY },
            },
          ],
        },

        // SIMPLE CHANNEL
        sms: {
          driver: TermiiDriver,
          options: { apiKey: process.env.TERMII_API_KEY, senderId: 'MyApp' },
        },

        // CUSTOM CHANNEL
        slack: {
          driver: SlackDriver,
          options: { webhookUrl: process.env.SLACK_WEBHOOK },
        },
      },
    }),
  ],
})
export class AppModule {}
```

### B. Vanilla Node.js / Express.js Configuration

Townkrier is isomorphic and can be used without NestJS.

```typescript
// townkrier.config.ts
import { TownkrierFactory } from 'townkrier';
import { ResendDriver } from 'townkrier-resend';

export const notificationManager = TownkrierFactory.create({
  defaultChannel: 'email',
  channels: {
    email: {
      driver: ResendDriver,
      options: { apiKey: process.env.RESEND_API_KEY },
    },
  },
});

// usage in an express controller
import { notificationManager } from './townkrier.config';

app.post('/register', async (req, res) => {
  const user = await createUser(req.body);
  await notificationManager.send(user, new WelcomeNotification(user));
  res.json({ success: true });
});
```

---

## 2. Notification Class Experience

The notification class remains the central place for logic, but with strict typing.

```typescript
import { Notification } from 'townkrier';
import { EmailMessage } from 'townkrier-resend'; // Type-safe message definition

export class InvoicePaid extends Notification {
  constructor(
    public invoiceId: string,
    public amount: number,
  ) {
    super();
  }

  // Dynamic channel selection
  via(notifiable: Notifiable): string[] {
    return notifiable.preferences?.wantsSms ? ['email', 'sms'] : ['email'];
  }

  // Type-safe Email content
  toEmail(notifiable: Notifiable): EmailMessage {
    return {
      subject: `Invoice #${this.invoiceId} Paid`,
      template: 'invoice-paid',
      context: { amount: this.amount },
    };
  }

  // SMS content
  toSms(notifiable: Notifiable): string {
    return `Your payment of $${this.amount} was received.`;
  }
}
```

---

## 3. Developing Custom Drivers (Type-Safe)

We use TypeScript Generics to ensure drivers are type-safe and avoid `any`.

### The Driver Interface

```typescript
// townkrier-core/src/interfaces/driver.interface.ts

// Standard interface for a Notifiable entity
export interface Notifiable {
  routeNotificationFor(driver: string): string | undefined;
  [key: string]: unknown; // Allow extensions
}

// Generic Driver Interface
export interface NotificationDriver<ConfigType = unknown, MessageType = unknown> {
  send(notifiable: Notifiable, message: MessageType, options?: ConfigType): Promise<SendResult>;
}

export interface SendResult {
  id: string;
  status: 'success' | 'failed';
  response?: unknown;
}
```

### Example: Implementing a Resend Driver

```typescript
// townkrier-resend/src/resend.driver.ts
import { NotificationDriver, SendResult, Notifiable } from 'townkrier-core';
import { Resend } from 'resend';

// Configure Config Type
export interface ResendConfig {
  apiKey: string;
  fromDefault?: string;
}

// Configure Message Type
export interface ResendMessage {
  subject: string;
  html?: string;
  to?: string;
}

// Implement with Generics
export class ResendDriver implements NotificationDriver<ResendConfig, ResendMessage> {
  private client: Resend;

  constructor(private config: ResendConfig) {
    this.client = new Resend(config.apiKey);
  }

  async send(notifiable: Notifiable, message: ResendMessage): Promise<SendResult> {
    const recipient = message.to || notifiable.routeNotificationFor('email');

    if (!recipient) throw new Error('Recipient not found');

    const response = await this.client.emails.send({
      from: this.config.fromDefault || 'no-reply@app.com',
      to: recipient,
      subject: message.subject,
      html: message.html,
    });

    return {
      id: response.id,
      status: 'success',
      response: response,
    };
  }
}
```

---

## 4. Architecture Summary

1.  **TownkrierFactory / Module**: The entry point. Handles configuration parsing and Driver instantiation.
2.  **NotificationManager**: The main service that `send()` is called on. It orchestrates the flow.
3.  **Drivers**: Type-safe classes that implement `NotificationDriver<Config, Message>`.
4.  **Notifiables**: Entites implementing `Notifiable` to resolve routing logic (e.g., getting the email address).
