# TownKrier Monorepo

> Laravel-style notification system for Node.js with multiple channels and providers

TownKrier is a flexible, provider-agnostic notification system inspired by Laravel's notification system. It supports multiple notification channels including email, SMS, push notifications, and in-app notifications.

## ✨ Features

- 🚀 **Multiple Channels**: Email, SMS, Push Notifications, In-App/Database
- 🔌 **Multiple Providers**: Resend (Email), Termii (SMS), FCM (Push)
- 🔄 **Fallback Support**: Automatic fallback to alternative channels/providers
- 📢 **Event System**: Laravel-style notification events (Sending, Sent, Failed)
- 🎯 **Type-Safe**: Full TypeScript support with strong typing
- 🏗️ **Extensible**: Easy to add custom channels and providers
- ⚙️ **Flexible Configuration**: Priority-based channel selection

## 📦 Packages

This monorepo contains the following packages:

- **[@townkrier/core](./packages/core)** - Core notification system and interfaces
- **[@townkrier/resend](./packages/resend)** - Resend email adapter
- **[@townkrier/fcm](./packages/channels/push/fcm)** - Firebase Cloud Messaging adapter for push notifications
- **[@townkrier/termii](./packages/channels/sms/termii)** - Termii SMS adapter

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Basic Usage

```typescript
import { NotificationManager, Notification, NotificationChannel } from '@townkrier/core';
import { createResendChannel } from '@townkrier/resend';

// Setup manager
const manager = new NotificationManager({
  defaultChannel: 'email-resend',
  channels: [
    {
      name: 'email-resend',
      enabled: true,
      config: {
        apiKey: process.env.RESEND_API_KEY,
        from: 'notifications@example.com',
      },
    },
  ],
});

manager.registerFactory('email-resend', createResendChannel);

// Create notification
class WelcomeNotification extends Notification {
  via() {
    return [NotificationChannel.EMAIL];
  }

  toEmail() {
    return {
      subject: 'Welcome!',
      html: '<h1>Welcome to our app!</h1>',
    };
  }
}

// Send notification
const notification = new WelcomeNotification();
const recipient = {
  [NotificationChannel.EMAIL]: { email: 'user@example.com' },
};

await manager.send(notification, recipient);
```

📖 **For complete usage examples, see [USAGE.md](./USAGE.md) and [examples/](./examples/)**

## 📖 Development

### Available Scripts

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Build a specific package
pnpm build:core
pnpm build:resend
pnpm build:fcm
pnpm build:termii

# Watch mode for development
pnpm dev

# Run tests
pnpm test
pnpm test:cov
pnpm test:watch

# Lint code
pnpm lint

# Format code
pnpm format
pnpm format:check

# Clean build artifacts
pnpm clean:build

# Clean everything (including node_modules)
pnpm clean
```

### Project Structure

```
townkrier-monorepo/
├── packages/              # All packages
│   ├── core/             # Core notification system
│   ├── resend/           # Resend email adapter
│   └── channels/         # Channel implementations
│       ├── sms/
│       │   └── termii/   # Termii SMS adapter
│       └── push/
│           └── fcm/      # Firebase Cloud Messaging adapter
├── examples/             # Usage examples
├── docs/                 # Documentation
├── .husky/              # Git hooks configuration
├── tsconfig.base.json   # Base TypeScript configuration
├── lerna.json           # Lerna configuration
├── pnpm-workspace.yaml  # pnpm workspace configuration
├── USAGE.md             # Complete usage guide
└── package.json         # Root package.json
```

### Adding a New Package

1. Create a new directory under `packages/` or `packages/channels/[type]/`
2. Add a `package.json` with the package name following the pattern `@townkrier/package-name`
3. Add a `tsconfig.json` that extends the base configuration
4. The workspace will automatically pick it up

### Publishing

```bash
# Version packages (interactive)
pnpm version

# Version with semantic versioning
pnpm version:patch   # 1.0.0 -> 1.0.1
pnpm version:minor   # 1.0.0 -> 1.1.0
pnpm version:major   # 1.0.0 -> 2.0.0
pnpm version:prerelease  # 1.0.0 -> 1.0.1-alpha.0

# Publish packages
pnpm publish

# Full release workflow
pnpm release:patch   # Build, version, and publish patch
pnpm release:minor   # Build, version, and publish minor
pnpm release:major   # Build, version, and publish major
pnpm release:alpha   # Build, version, and publish alpha
```

## 🎯 Roadmap

### MVP (Completed)

- [x] Core notification system
- [x] Email channel (Resend)
- [x] SMS channel (Termii)
- [x] Push channel (FCM)
- [x] Notification events
- [x] Fallback support
- [x] Type-safe API

### Future Plans

- [ ] Database/In-App channel with Prisma
- [ ] Localization support
- [ ] More email providers (Postmark, etc.)
- [ ] More SMS providers (Twilio, etc.)
- [ ] More push providers (APNs, OneSignal, etc.)
- [ ] Webhook notifications
- [ ] Batch notifications
- [ ] Scheduled notifications
- [ ] Rate limiting
- [ ] Queue integration

## 🛠️ Technology Stack

- **Package Manager:** pnpm
- **Monorepo Tool:** Lerna
- **Language:** TypeScript
- **Testing:** Jest
- **Linting:** ESLint
- **Formatting:** Prettier

## 📚 Documentation

- [Complete Usage Guide](./USAGE.md) - Comprehensive usage examples and API documentation
- [Complete Example](./examples/complete-example.ts) - Full working example with all features
- [Functional Requirements Document](./docs/TownKrier-FRD.md)
- [Technical Requirements Document](./docs/TownKrier-TRD.md)

## 📝 License

MIT

## 👤 Author

Jeremiah Olisa

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 💡 Inspiration

Inspired by [Laravel Notifications](https://laravel.com/docs/notifications) - bringing the same great developer experience to Node.js/TypeScript.
