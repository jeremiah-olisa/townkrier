# TownKrier Quick Start Guide

Get up and running with TownKrier in 5 minutes! 🚀

## Prerequisites

- Node.js >= 18.0.0
- npm, yarn, or pnpm package manager
- API keys for the channels you want to use

## Step 1: Installation

Install the core package and the channels you need:

```bash
# Using npm
npm install townkrier-core

# Install channel packages as needed
npm install townkrier-resend  # For email
npm install townkrier-termii  # For SMS
npm install townkrier-fcm     # For push notifications

# Optional: Queue and monitoring
npm install townkrier-queue townkrier-storage townkrier-dashboard
```

Or with pnpm:

```bash
pnpm add townkrier-core townkrier-resend townkrier-termii townkrier-fcm
```

## Step 2: Get Your API Keys

### Email (Resend)

1. Sign up at [resend.com](https://resend.com)
2. Get your API key from [API Keys page](https://resend.com/api-keys)
3. Verify your sending domain

### SMS (Termii)

1. Sign up at [termii.com](https://termii.com)
2. Get your API key from your dashboard
3. Configure your sender ID

### Push Notifications (Firebase Cloud Messaging)

1. Create a project at [Firebase Console](https://console.firebase.google.com)
2. Download your service account JSON file
3. Note your project ID

## Step 3: Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```bash
# Email
RESEND_API_KEY=re_your_actual_api_key
RESEND_FROM_EMAIL=notifications@yourdomain.com
RESEND_FROM_NAME=Your App

# SMS
TERMII_API_KEY=your_actual_termii_key
TERMII_SENDER_ID=YourApp

# Push
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
FIREBASE_PROJECT_ID=your-project-id
```

## Step 4: Verify Setup

Run the verification script to check your configuration:

```bash
npm run verify
# or
pnpm verify
```

This will check if all your API keys and configuration are correct.

## Step 5: Send Your First Notification

Create a file `send-notification.ts`:

```typescript
import { NotificationManager, Notification, NotificationChannel } from 'townkrier-core';
import { createResendChannel } from 'townkrier-resend';

// Setup manager
const manager = new NotificationManager({
  defaultChannel: 'email-resend',
  channels: [
    {
      name: 'email-resend',
      enabled: true,
      config: {
        apiKey: process.env.RESEND_API_KEY!,
        from: process.env.RESEND_FROM_EMAIL!,
        fromName: process.env.RESEND_FROM_NAME,
      },
    },
  ],
});

// Register channel
manager.registerFactory('email-resend', createResendChannel);

// Create notification class
class WelcomeNotification extends Notification {
  via() {
    return [NotificationChannel.EMAIL];
  }

  toEmail() {
    return {
      subject: 'Welcome to TownKrier!',
      html: '<h1>Welcome!</h1><p>Your first notification works!</p>',
    };
  }
}

// Send notification
async function sendWelcome() {
  const notification = new WelcomeNotification();
  const recipient = {
    [NotificationChannel.EMAIL]: {
      email: 'user@example.com',
    },
  };

  try {
    const results = await manager.send(notification, recipient);
    console.log('✅ Notification sent successfully!', results);
  } catch (error) {
    console.error('❌ Failed to send notification:', error);
  }
}

sendWelcome();
```

Run it:

```bash
npx tsx send-notification.ts
# or compile and run with node
```

## Step 6: Multi-Channel Notifications

Send to multiple channels at once:

```typescript
class ImportantAlert extends Notification {
  via() {
    return [NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.PUSH];
  }

  toEmail() {
    return {
      subject: 'Important Alert!',
      html: '<h1>Action Required</h1>',
    };
  }

  toSms() {
    return {
      to: '+1234567890',
      message: 'Important alert: Action required!',
    };
  }

  toPush() {
    return {
      token: 'device_fcm_token',
      notification: {
        title: 'Important Alert',
        body: 'Action required!',
      },
    };
  }
}
```

## Step 7: Using Multiple Drivers with Mappers

When using multiple drivers with different message formats (e.g., multiple WhatsApp providers), use **message mappers** to keep your notifications clean and type-safe:

```typescript
// 1. Define your unified message format
interface UnifiedWhatsappMessage {
  to: string;
  text: string;
  media?: string;
}

// 2. Create mappers for each driver
class WhapiMessageMapper implements MessageMapper<UnifiedWhatsappMessage, WhapiMessage> {
  map(msg: UnifiedWhatsappMessage): WhapiMessage {
    return { to: msg.to, body: msg.text, media: msg.media };
  }
}

// 3. Register drivers with mappers
const fallbackConfig: FallbackStrategyConfig = {
  strategy: 'priority-fallback',
  drivers: [
    {
      driver: new WhapiDriver(config),
      mapper: new WhapiMessageMapper(),  // ← Register mapper once
    },
  ],
};

// 4. Notification uses unified format (mappers handle transformation)
class OrderNotification extends Notification<'whatsapp'> {
  toWhatsapp(notifiable: Notifiable): UnifiedWhatsappMessage {
    return {
      to: notifiable.routeNotificationFor('whatsapp') as string,
      text: 'Order confirmed! ✅',
      // ✅ Type-safe, no 'as any' needed!
    };
  }
}
```

**Key Points:**
- 📌 Mappers are optional - you only need them with multiple drivers
- 🔄 Configured once during setup, used across all notifications
- 🛡️ Type-safe - no casting needed in notifications
- 📚 See [whatsapp-with-mapper-config.ts](./examples/whatsapp-with-mapper-config.ts) for a complete example

## Next Steps

### 🎯 Generate Notification Classes

Use the CLI to generate notification classes:

```bash
npm run make:notification WelcomeUser
```

### 📋 Add Queue System

Process notifications in the background:

```typescript
import { QueueManager, InMemoryQueueAdapter } from 'townkrier-queue';

const queueManager = new QueueManager(new InMemoryQueueAdapter(), notificationManager);

// Queue for later
await queueManager.enqueue(notification, recipient);

// Start processing
queueManager.startProcessing();
```

### 📊 Add Dashboard

Monitor your notifications:

```typescript
import { DashboardServer } from 'townkrier-dashboard';
import { StorageManager, InMemoryStorageAdapter } from 'townkrier-storage';

const storage = new StorageManager(new InMemoryStorageAdapter());
const dashboard = new DashboardServer({
  queueManager,
  storageManager: storage,
  port: 3000,
});

dashboard.start();
// Visit http://localhost:3000/dashboard
```

### 📚 Learn More

- [Complete Usage Guide](./USAGE.md) - Comprehensive documentation
- [Examples](./examples/) - Working code examples
- [Architecture](./ARCHITECTURE.md) - System design
- [API Reference](./packages/core/README.md) - Detailed API docs

## Common Issues

### TypeScript Errors

Make sure you have TypeScript types installed:

```bash
npm install --save-dev @types/node
```

### API Key Not Working

- Verify the key is correct (no extra spaces)
- Check if the key has required permissions
- For Resend, verify your domain
- For Termii, check your account balance

### Import Errors

Make sure packages are built:

```bash
npm run build
```

## Getting Help

- 📖 Read the [documentation](./USAGE.md)
- 💬 [Open an issue](https://github.com/jeremiah-olisa/townkrier/issues)
- 🐛 Report bugs on GitHub
- ⭐ Star the repo if you find it useful!

---

**Ready to send notifications?** Let's go! 🚀
