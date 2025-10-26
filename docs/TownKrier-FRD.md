# TownKrier - Functional Requirements Document (FRD)

<invoke name="artifacts">
<parameter name="command">create</parameter>
<parameter name="type">text/markdown</parameter>
<parameter name="id">townkrier-frd</parameter>
<parameter name="title">TownKrier FRD v1.0</parameter>
<parameter name="content"># TownKrier - Functional Requirements Document

**Version:** 1.0  
**Date:** October 24, 2025  
**Status:** Draft

---

## 1. Executive Summary

TownKrier (pronounced "town crier") is an open-source, framework-agnostic notification package for Node.js that brings Laravel-style notification capabilities to the JavaScript ecosystem. The package enables developers to send notifications across multiple channels (email, SMS, push, in-app, etc.) using a unified, elegant API while maintaining complete flexibility in provider choice and avoiding vendor lock-in.

---

## 2. Project Goals

### 2.1 Primary Goals
- Provide a Laravel Notifications-inspired API for Node.js applications
- Support multiple notification channels with pluggable provider architecture
- Ensure framework-agnostic core with enhanced support for NestJS
- Enable both synchronous and asynchronous (queued) notification delivery
- Maintain zero vendor lock-in through adapter pattern
- Offer comprehensive CLI tooling for scaffolding and management

### 2.2 Success Criteria
- Seamless integration with Express, NestJS, and other Node.js frameworks
- Support for at least 3 channels (Email, SMS, Push) at v1.0 launch
- Documentation quality matching or exceeding Laravel's standard
- Community adoption of 1000+ npm downloads within 6 months
- Test coverage above 90%

---

## 3. Core Concepts

### 3.1 Notification Architecture
```
Notification Class → Notifiable Entity → Channel(s) → Provider(s) → Delivery
```

### 3.2 Key Components
1. **Notification Classes** - Define what to send and via which channels
2. **Notifiable Interface** - Entities that can receive notifications (Users, etc.)
3. **Channels** - Delivery mechanisms (Email, SMS, Push, In-App, etc.)
4. **Providers/Adapters** - Concrete implementations for services (Resend, Twilio, etc.)
5. **Queue Manager** - Background job processing for async notifications
6. **CLI Tools** - Code generation and management utilities

---

## 4. Functional Requirements

### 4.1 Notification Classes

#### FR-4.1.1 Notification Definition
- **Description:** Developers can create notification classes that define content and routing
- **Requirements:**
  - Base `Notification` class for extension
  - `via()` method to specify channels
  - Channel-specific methods (e.g., `toMail()`, `toSms()`)
  - Support for conditional channel selection based on notifiable preferences
  - TypeScript support with full type inference

#### FR-4.1.2 Notification Content
- **Description:** Flexible content definition for different channels
- **Requirements:**
  - Plain object or class-based content definition
  - Support for templates/views
  - Dynamic content based on notifiable properties
  - Locale/internationalization support
  - Markdown support for email content

**Example:**
```typescript
class OrderShipped extends Notification {
  constructor(private order: Order) {
    super();
  }

  via(notifiable: Notifiable): string[] {
    return notifiable.prefers === 'sms' 
      ? ['sms', 'database'] 
      : ['mail', 'database'];
  }

  toMail(notifiable: Notifiable): MailMessage {
    return new MailMessage()
      .subject('Order Shipped')
      .line(`Your order #${this.order.id} has shipped!`)
      .action('Track Order', this.order.trackingUrl)
      .line('Thank you for your purchase!');
  }

  toSms(notifiable: Notifiable): SmsMessage {
    return new SmsMessage()
      .content(`Order #${this.order.id} shipped! Track: ${this.order.trackingUrl}`);
  }
}
```

---

### 4.2 Notifiable Interface

#### FR-4.2.1 Notifiable Contract
- **Description:** Interface that entities must implement to receive notifications
- **Requirements:**
  - `routeNotificationFor(channel: string)` method to return channel addresses
  - Optional `preferredChannels()` method for user preferences
  - Support for multiple addresses per channel (e.g., multiple emails)

**Example:**
```typescript
interface Notifiable {
  routeNotificationFor(channel: string): string | string[] | null;
  preferredChannels?(): string[];
}

class User implements Notifiable {
  email: string;
  phone: string;
  fcmToken: string;

  routeNotificationFor(channel: string): string | null {
    switch (channel) {
      case 'mail': return this.email;
      case 'sms': return this.phone;
      case 'fcm': return this.fcmToken;
      default: return null;
    }
  }
}
```

---

### 4.3 Channel System

#### FR-4.3.1 Built-in Channels
- **Mail Channel** - Email notifications
- **SMS Channel** - Text message notifications
- **Push Channel** - Mobile/web push notifications
- **Database Channel** - In-app notification storage
- **Slack Channel** - Slack message notifications

#### FR-4.3.2 Channel Interface
- **Description:** Standardized interface for all channels
- **Requirements:**
  - `send(notifiable: Notifiable, notification: Notification)` method
  - Async operation support
  - Error handling and retry logic
  - Success/failure callbacks
  - Channel-specific configuration

#### FR-4.3.3 Custom Channels
- **Description:** Developers can create custom channels
- **Requirements:**
  - Extend base `Channel` class or implement `ChannelInterface`
  - Registration mechanism with channel name
  - Auto-discovery support via configuration
  - Full TypeScript support

**Example:**
```typescript
class WhatsAppChannel implements ChannelInterface {
  async send(notifiable: Notifiable, notification: Notification): Promise<void> {
    const message = notification.toWhatsApp(notifiable);
    const recipient = notifiable.routeNotificationFor('whatsapp');
    
    await this.provider.send(recipient, message);
  }
}
```

---

### 4.4 Provider/Adapter System

#### FR-4.4.1 Provider Architecture
- **Description:** Pluggable adapter pattern for service providers
- **Requirements:**
  - Abstract provider interfaces per channel type
  - No built-in provider dependencies (all optional)
  - Provider registration and configuration system
  - Support for provider-specific options
  - Failover support (try provider A, fallback to provider B)

#### FR-4.4.2 Email Providers
- **Supported (via adapters):**
  - Resend
  - Postmark
  - SendGrid
  - AWS SES
  - Mailgun
  - SMTP (nodemailer)
  - Custom adapters

#### FR-4.4.3 SMS Providers
- **Supported (via adapters):**
  - Twilio
  - Termii
  - AWS SNS
  - Vonage (Nexmo)
  - Custom adapters

#### FR-4.4.4 Push Providers
- **Supported (via adapters):**
  - Firebase Cloud Messaging (FCM)
  - Apple Push Notification Service (APNS)
  - OneSignal
  - Custom adapters

#### FR-4.4.5 Database Provider
- **Description:** Storage adapter for in-app notifications
- **Requirements:**
  - Interface-based adapter system
  - Reference implementations for:
    - PostgreSQL (via TypeORM, Prisma, Drizzle)
    - MySQL (via TypeORM, Prisma, Drizzle)
    - MongoDB
    - Redis
  - Schema definition/migration helpers
  - CRUD operations for notifications
  - Marking as read/unread
  - Notification expiration/cleanup

**Example Configuration:**
```typescript
TownKrier.configure({
  channels: {
    mail: {
      provider: 'resend',
      config: {
        apiKey: process.env.RESEND_API_KEY,
      },
      fallback: {
        provider: 'smtp',
        config: { /* smtp config */ }
      }
    },
    sms: {
      provider: 'twilio',
      config: {
        accountSid: process.env.TWILIO_SID,
        authToken: process.env.TWILIO_TOKEN,
        from: process.env.TWILIO_FROM
      }
    },
    database: {
      provider: 'postgresql',
      adapter: new PostgresAdapter(dataSource)
    }
  }
});
```

---

### 4.5 Sending Notifications

#### FR-4.5.1 Immediate Sending
- **Description:** Send notifications synchronously
- **Requirements:**
  - Simple API: `user.notify(new OrderShipped(order))`
  - Support for single or multiple notifiables
  - Return delivery status information
  - Error handling without throwing (optional)

**Example:**
```typescript
// Single recipient
await user.notify(new WelcomeNotification());

// Multiple recipients
await TownKrier.send(users, new OrderShipped(order));

// With error handling
const result = await user.notify(new InvoicePaid(invoice));
if (result.failed.length > 0) {
  // Handle failures
}
```

#### FR-4.5.2 Queued/Background Sending
- **Description:** Queue notifications for background processing
- **Requirements:**
  - Queue adapter interface (BullMQ, Redis Queue, AWS SQS, etc.)
  - `delay()` method for scheduled notifications
  - Queue priority support
  - Retry logic with exponential backoff
  - Dead letter queue for failed notifications
  - Queue monitoring and statistics

**Example:**
```typescript
// Queue notification
await user.notify(new ReminderNotification()).queue();

// Delayed notification
await user.notify(new TrialEnding())
  .delay(60 * 60 * 24 * 7); // 7 days

// With specific queue
await user.notify(new LowPriority())
  .onQueue('notifications-low')
  .queue();
```

---

### 4.6 CLI Tools

#### FR-4.6.1 Notification Generation
- **Description:** Scaffold new notification classes
- **Requirements:**
  - Command: `townkrier make:notification <name>`
  - Options for pre-selecting channels
  - TypeScript/JavaScript template support
  - Customizable templates

**Example:**
```bash
townkrier make:notification OrderShipped --channels=mail,sms,database
```

#### FR-4.6.2 Channel Generation
- **Description:** Create custom channel implementations
- **Requirements:**
  - Command: `townkrier make:channel <name>`
  - Generates channel class with interface implementation
  - Provider registration template

**Example:**
```bash
townkrier make:channel WhatsApp
```

#### FR-4.6.3 Provider Adapter Generation
- **Description:** Scaffold provider adapters
- **Requirements:**
  - Command: `townkrier make:provider <channel> <name>`
  - Interface-compliant templates
  - Configuration scaffolding

**Example:**
```bash
townkrier make:provider mail Brevo
```

#### FR-4.6.4 Database Setup
- **Description:** Generate migrations and models for database channel
- **Requirements:**
  - Command: `townkrier install:database`
  - Support for multiple ORMs (TypeORM, Prisma, Drizzle, Sequelize)
  - Generate migration files
  - Generate model/entity classes

**Example:**
```bash
townkrier install:database --orm=prisma
```

#### FR-4.6.5 Testing Tools
- **Description:** Notification testing utilities
- **Requirements:**
  - Command: `townkrier test:notification <name>`
  - Send test notifications to specific addresses
  - Fake/mock mode for testing
  - Assertion helpers for tests

---

### 4.7 Framework Integration

#### FR-4.7.1 Framework-Agnostic Core
- **Requirements:**
  - Core package has zero framework dependencies
  - Standalone usage without any framework
  - Configuration via plain JavaScript/TypeScript objects
  - No reliance on decorators or framework-specific features in core

#### FR-4.7.2 NestJS Integration
- **Package:** `@townkrier/nestjs`
- **Requirements:**
  - Injectable services with DI support
  - Module-based configuration
  - Decorator support (@Notifiable, @NotificationChannel)
  - Integration with NestJS queue module
  - Interceptor for automatic notification tracking
  - Health check indicators

**Example:**
```typescript
// app.module.ts
@Module({
  imports: [
    TownKrierModule.forRoot({
      channels: { /* config */ }
    })
  ]
})
export class AppModule {}

// service usage
@Injectable()
export class OrderService {
  constructor(private townkrier: TownKrierService) {}

  async shipOrder(order: Order) {
    await this.townkrier.send(
      order.user,
      new OrderShipped(order)
    );
  }
}
```

#### FR-4.7.3 Express Integration
- **Package:** `@townkrier/express`
- **Requirements:**
  - Middleware for adding TownKrier to request object
  - Simple configuration function
  - Route helpers for webhook handling

**Example:**
```typescript
import { setupTownKrier } from '@townkrier/express';

const app = express();
setupTownKrier(app, { /* config */ });

app.post('/orders/:id/ship', async (req, res) => {
  await req.townkrier.send(
    user,
    new OrderShipped(order)
  );
  res.json({ success: true });
});
```

#### FR-4.7.4 Other Framework Support
- **Future packages:**
  - `@townkrier/fastify`
  - `@townkrier/hono`
  - `@townkrier/adonis`

---

### 4.8 Configuration Management

#### FR-4.8.1 Configuration Options
- **Description:** Flexible configuration system
- **Requirements:**
  - Environment variable support
  - Config file support (JS, TS, JSON)
  - Runtime configuration updates
  - Per-environment configs
  - Validation of required fields

#### FR-4.8.2 Configuration File
- **Location:** `townkrier.config.ts` or `townkrier.config.js`
- **Structure:**
```typescript
export default {
  channels: {
    mail: { /* ... */ },
    sms: { /* ... */ },
    push: { /* ... */ },
    database: { /* ... */ }
  },
  queue: {
    driver: 'bullmq',
    connection: { /* redis config */ },
    retries: 3,
    backoff: 'exponential'
  },
  defaults: {
    channels: ['mail', 'database']
  }
};
```

---

### 4.9 Event System

#### FR-4.9.1 Notification Events
- **Description:** Lifecycle hooks for notifications
- **Requirements:**
  - Events: `sending`, `sent`, `failed`
  - Channel-specific events
  - Event listener registration
  - Async event handlers
  - Event payload includes notification, notifiable, channel, result

**Example:**
```typescript
TownKrier.on('notification.sent', (event) => {
  console.log(`Sent ${event.notification.constructor.name} via ${event.channel}`);
  // Log to analytics, etc.
});

TownKrier.on('notification.failed', (event) => {
  console.error(`Failed to send via ${event.channel}:`, event.error);
  // Alert monitoring system
});
```

---

### 4.10 Testing Support

#### FR-4.10.1 Fake Mode
- **Description:** Testing utilities without sending real notifications
- **Requirements:**
  - `TownKrier.fake()` method to enable fake mode
  - Assertion methods:
    - `assertSent(notification, callback?)`
    - `assertNotSent(notification)`
    - `assertSentTo(notifiable, notification)`
    - `assertCount(count)`
  - Access to sent notifications for inspection
  - Per-channel faking

**Example:**
```typescript
// test file
import { TownKrier } from 'townkrier';

describe('Order Service', () => {
  beforeEach(() => {
    TownKrier.fake();
  });

  it('sends notification when order ships', async () => {
    await orderService.ship(order);

    TownKrier.assertSent(OrderShipped, (notification) => {
      return notification.order.id === order.id;
    });

    TownKrier.assertSentTo(user, OrderShipped);
  });
});
```

---

### 4.11 Localization

#### FR-4.11.1 Multi-language Support
- **Description:** Send notifications in user's preferred language
- **Requirements:**
  - Integration with i18n libraries (i18next, etc.)
  - Locale method on notifications
  - Fallback locale support
  - Per-notifiable locale detection

**Example:**
```typescript
class WelcomeNotification extends Notification {
  toMail(notifiable: Notifiable): MailMessage {
    return new MailMessage()
      .locale(notifiable.locale)
      .subject('notifications.welcome.subject')
      .line('notifications.welcome.body');
  }
}
```

---

### 4.12 Rate Limiting

#### FR-4.12.1 Notification Throttling
- **Description:** Prevent notification spam
- **Requirements:**
  - Per-notifiable rate limiting
  - Per-channel rate limiting
  - Configurable time windows
  - Override options for urgent notifications
  - Rate limit storage (memory, Redis, database)

**Example:**
```typescript
class ReminderNotification extends Notification {
  rateLimit(): RateLimitConfig {
    return {
      maxAttempts: 3,
      decayMinutes: 60
    };
  }
}
```

---

## 5. Non-Functional Requirements

### 5.1 Performance
- Queue processing: 1000+ notifications per second
- Synchronous sends: <100ms overhead
- Database queries: Indexed and optimized
- Memory usage: <50MB for base package

### 5.2 Reliability
- 99.9% successful delivery for valid configurations
- Automatic retry with exponential backoff
- Circuit breaker for failing providers
- Comprehensive error logging

### 5.3 Security
- No credential logging
- Support for credential encryption
- Webhook signature verification
- Input sanitization for all content

### 5.4 Scalability
- Horizontal scaling support via queue system
- No shared state between processes
- Distributed queue support (Redis, SQS)
- Stateless channel implementations

### 5.5 Maintainability
- 90%+ test coverage
- Comprehensive documentation
- Clear contribution guidelines
- Semantic versioning
- Deprecation policy (6 months notice)

---

## 6. Technical Stack

### 6.1 Core Dependencies
- TypeScript 5+
- Node.js 18+ (LTS)
- Minimal runtime dependencies

### 6.2 Optional Dependencies
- Queue: BullMQ, Redis, AWS SQS adapters
- Database: TypeORM, Prisma, Drizzle, MongoDB drivers
- Testing: Jest, Vitest support

### 6.3 Development Dependencies
- ESLint + Prettier
- Conventional commits
- Changesets for versioning
- Turborepo for monorepo management

---

## 7. Package Structure

### 7.1 Monorepo Layout
```
packages/
├── core/                    # @townkrier/core
├── cli/                     # @townkrier/cli
├── nestjs/                  # @townkrier/nestjs
├── express/                 # @townkrier/express
├── channels/
│   ├── mail/               # @townkrier/channel-mail
│   ├── sms/                # @townkrier/channel-sms
│   ├── push/               # @townkrier/channel-push
│   └── database/           # @townkrier/channel-database
├── providers/
│   ├── resend/             # @townkrier/provider-resend
│   ├── postmark/           # @townkrier/provider-postmark
│   ├── twilio/             # @townkrier/provider-twilio
│   ├── termii/             # @townkrier/provider-termii
│   └── fcm/                # @townkrier/provider-fcm
└── queues/
    ├── bullmq/             # @townkrier/queue-bullmq
    ├── sqs/                # @townkrier/queue-sqs
    └── redis/              # @townkrier/queue-redis
```

### 7.2 Installation Examples
```bash
# Core package
npm install @townkrier/core

# With NestJS
npm install @townkrier/core @townkrier/nestjs

# With email support
npm install @townkrier/core @townkrier/channel-mail @townkrier/provider-resend

# Full setup
npm install @townkrier/core @townkrier/cli \
  @townkrier/channel-mail @townkrier/channel-sms @townkrier/channel-database \
  @townkrier/provider-resend @townkrier/provider-twilio \
  @townkrier/queue-bullmq
```

---

## 8. Documentation Requirements

### 8.1 Documentation Structure
- Getting Started Guide
- Installation per framework
- Configuration Guide
- Channel-specific guides
- Provider setup guides
- Queue configuration
- Testing guide
- API Reference (auto-generated)
- Migration guides (from other libraries)
- Recipes/Cookbook

### 8.2 Documentation Standards
- Code examples for every feature
- Video tutorials for complex workflows
- Interactive playground (CodeSandbox)
- Comparison with Laravel Notifications
- Community examples repository

---

## 9. Release Plan

### 9.1 v0.1.0 - Alpha (Week 1-4)
- Core notification system
- Basic mail channel
- Simple SMTP provider
- CLI scaffolding
- Basic documentation

### 9.2 v0.5.0 - Beta (Week 5-8)
- All core channels (Mail, SMS, Push, Database)
- 2+ providers per channel
- Queue support
- NestJS integration
- Comprehensive tests

### 9.3 v1.0.0 - Stable (Week 9-12)
- Production-ready
- Full documentation
- Express integration
- 5+ provider adapters
- Migration guide from other libraries
- Performance benchmarks

### 9.4 Post v1.0
- Additional framework integrations
- More provider adapters
- Advanced features (A/B testing, analytics)
- Admin UI for notification management
- GraphQL subscriptions support

---

## 10. Success Metrics

### 10.1 Technical Metrics
- Test coverage > 90%
- Build time < 30s
- Package size < 100KB (core)
- Zero critical security vulnerabilities
- TypeScript strict mode compliant

### 10.2 Adoption Metrics
- 1000+ npm downloads/month (6 months)
- 500+ GitHub stars (1 year)
- 10+ community providers (1 year)
- 5+ production case studies (1 year)

### 10.3 Quality Metrics
- <10 open bugs at any time
- <48h average issue response time
- >4.5 stars on npm
- Active community contributions

---

## 11. Open Questions

1. **Database Schema:** Should we provide a canonical schema or just an interface?
2. **Webhook Handling:** Should we include webhook receivers for provider callbacks?
3. **Analytics:** Built-in analytics vs. integration with external services?
4. **Templates:** Should we include a template engine or integrate with existing ones?
5. **Batching:** Support for batch notifications (e.g., daily digest)?
6. **Multi-tenancy:** How to handle SaaS apps with multiple tenants?

---

## 12. Appendices

### 12.1 Glossary
- **Notifiable:** An entity that can receive notifications
- **Channel:** A delivery mechanism (email, SMS, etc.)
- **Provider:** A service implementation (Resend, Twilio, etc.)
- **Adapter:** Interface implementation for a specific service
- **Queue:** Background job system for async processing

### 12.2 References
- Laravel Notifications: https://laravel.com/docs/notifications
- BullMQ: https://docs.bullmq.io/
- NestJS: https://nestjs.com/

---

**Document Approval:**

This document is subject to review and updates as the project evolves.

**Last Updated:** October 24, 2025</parameter>