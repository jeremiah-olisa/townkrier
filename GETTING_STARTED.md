# Simple Getting Started Example

This is a minimal example to help you get started with TownKrier quickly.

## Prerequisites

1. Node.js >= 18.0.0
2. API keys for the channels you want to use (see below)

## Setup

### 1. Install Dependencies

trigger update

```bash
npm install townkrier-core townkrier-resend
# or
pnpm add townkrier-core townkrier-resend
```

### 2. Get API Keys

#### Resend (Email)

1. Sign up at https://resend.com
2. Verify your domain
3. Create an API key from the dashboard

### 3. Create Your First Notification

Create a file `send-email.ts`:

```typescript
import { NotificationManager, Notification, NotificationChannel } from 'townkrier-core';
import { createResendChannel } from 'townkrier-resend';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create notification class
class WelcomeNotification extends Notification {
  constructor(private userName: string) {
    super();
  }

  via() {
    return [NotificationChannel.EMAIL];
  }

  toEmail() {
    return {
      subject: `Welcome ${this.userName}! 🎉`,
      html: `
        <h1>Welcome to TownKrier!</h1>
        <p>Hi ${this.userName},</p>
        <p>Thank you for trying out TownKrier. You've successfully sent your first notification!</p>
      `,
      text: `Welcome to TownKrier! Hi ${this.userName}, thank you for trying out TownKrier.`,
    };
  }
}

// Setup notification manager
async function main() {
  const manager = new NotificationManager({
    defaultChannel: 'email-resend',
    channels: [
      {
        name: 'email-resend',
        enabled: true,
        config: {
          apiKey: process.env.RESEND_API_KEY!,
          from: process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com',
          fromName: process.env.RESEND_FROM_NAME || 'Your App',
        },
      },
    ],
  });

  // Register channel factory
  manager.registerFactory('email-resend', createResendChannel);

  // Create and send notification
  const notification = new WelcomeNotification('John Doe');
  const recipient = {
    [NotificationChannel.EMAIL]: {
      email: 'your-email@example.com', // Change this to your email
      name: 'John Doe',
    },
  };

  try {
    console.log('📤 Sending notification...');
    const results = await manager.send(notification, recipient);
    console.log('✅ Notification sent successfully!');
    console.log('Results:', results);
  } catch (error) {
    console.error('❌ Failed to send notification:', error);
  }
}

main();
```

### 4. Create Environment File

Create a `.env` file:

```bash
RESEND_API_KEY=re_your_actual_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=Your App Name
```

### 5. Run the Example

```bash
# Install dotenv if you haven't
npm install dotenv

# Run with tsx (recommended)
npx tsx send-email.ts

# Or compile and run with node
npx tsc send-email.ts
node send-email.js
```

## Expected Output

```
📤 Sending notification...
✅ Notification sent successfully!
Results: Map(1) {
  'email-resend' => {
    success: true,
    messageId: 'xxx-xxx-xxx',
    channel: 'email-resend'
  }
}
```

## Next Steps

### Add SMS Notifications

```bash
npm install townkrier-termii
```

```typescript
import { createTermiiChannel } from 'townkrier-termii';

// Add to channels config
{
  name: 'sms-termii',
  enabled: true,
  config: {
    apiKey: process.env.TERMII_API_KEY!,
    senderId: 'YourApp',
  },
}

// Register factory
manager.registerFactory('sms-termii', createTermiiChannel);

// Update notification to support SMS
class WelcomeNotification extends Notification {
  via() {
    return [NotificationChannel.EMAIL, NotificationChannel.SMS];
  }

  toSms() {
    return {
      to: '+1234567890',
      message: `Welcome ${this.userName}! Thanks for joining.`,
    };
  }
}
```

### Add Push Notifications

```bash
npm install townkrier-fcm
```

```typescript
import { createFcmChannel } from 'townkrier-fcm';

// Add to channels config
{
  name: 'push-fcm',
  enabled: true,
  config: {
    projectId: process.env.FIREBASE_PROJECT_ID!,
    serviceAccountPath: './firebase-service-account.json',
  },
}

// Register factory
manager.registerFactory('push-fcm', createFcmChannel);
```

### Add Queue for Background Processing

```bash
npm install townkrier-queue
```

```typescript
import { QueueManager, InMemoryQueueAdapter } from 'townkrier-queue';

const queueManager = new QueueManager(new InMemoryQueueAdapter(), notificationManager);

// Queue notification for background processing
await queueManager.enqueue(notification, recipient);

// Start processing
queueManager.startProcessing();
```

### Add Dashboard for Monitoring

```bash
npm install townkrier-dashboard townkrier-storage
```

```typescript
import { DashboardServer } from 'townkrier-dashboard';
import { StorageManager, InMemoryStorageAdapter } from 'townkrier-storage';

const storageManager = new StorageManager(new InMemoryStorageAdapter());
const dashboard = new DashboardServer({
  queueManager,
  storageManager,
  port: 3000,
});

dashboard.start();
// Visit http://localhost:3000/dashboard
```

## Troubleshooting

### "Invalid API key"

- Check your `.env` file
- Verify the API key is correct
- Ensure no extra spaces in the key

### "Domain not verified" (Resend)

- Verify your domain in Resend dashboard
- Add DNS records (SPF, DKIM)
- Wait for DNS propagation

### Import errors

- Make sure all packages are installed
- Run `npm install` again
- Check package versions are compatible

## Common Use Cases

### Password Reset Email

```typescript
class PasswordResetNotification extends Notification {
  constructor(
    private resetUrl: string,
    private userName: string,
  ) {
    super();
  }

  via() {
    return [NotificationChannel.EMAIL];
  }

  toEmail() {
    return {
      subject: 'Reset Your Password',
      html: `
        <h2>Password Reset Request</h2>
        <p>Hi ${this.userName},</p>
        <p>Click the link below to reset your password:</p>
        <a href="${this.resetUrl}">Reset Password</a>
        <p>This link expires in 1 hour.</p>
      `,
    };
  }
}
```

### Order Confirmation

```typescript
class OrderConfirmationNotification extends Notification {
  constructor(
    private orderNumber: string,
    private total: number,
  ) {
    super();
  }

  via() {
    return [NotificationChannel.EMAIL, NotificationChannel.SMS];
  }

  toEmail() {
    return {
      subject: `Order Confirmation #${this.orderNumber}`,
      html: `
        <h1>Order Confirmed!</h1>
        <p>Order #${this.orderNumber}</p>
        <p>Total: $${this.total}</p>
      `,
    };
  }

  toSms() {
    return {
      to: '+1234567890',
      message: `Order #${this.orderNumber} confirmed! Total: $${this.total}`,
    };
  }
}
```

## Resources

- [Complete Documentation](./README.md)
- [API Reference](./packages/core/README.md)
- [More Examples](./examples/)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

## Need Help?

- [Open an Issue](https://github.com/jeremiah-olisa/townkrier/issues)
- [View Examples](../examples/)
- [Read the Docs](../README.md)
