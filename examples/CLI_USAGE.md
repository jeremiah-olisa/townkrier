# TownKrier CLI Usage Example

This document demonstrates how to use the TownKrier CLI tool to generate notification classes.

## Prerequisites

1. Build the CLI package:

```bash
pnpm build:cli
```

## Basic Usage

### 1. Generate a Simple Email Notification

```bash
node packages/cli/bin/townkrier.js make:notification WelcomeEmail --channels email --path examples/notifications
```

This creates `WelcomeEmail.notification.ts` with just the email channel method.

### 2. Generate a Multi-Channel Notification

```bash
node packages/cli/bin/townkrier.js make:notification OrderConfirmation --channels email,sms,push --path examples/notifications
```

This creates `OrderConfirmation.notification.ts` with email, SMS, and push notification methods.

### 3. Interactive Mode (Recommended for Beginners)

```bash
node packages/cli/bin/townkrier.js make:notification UserInvite --path examples/notifications
```

This will prompt you to select which channels you want to include.

### 4. Generate All Channels

```bash
node packages/cli/bin/townkrier.js make:notification ImportantAlert --channels email,sms,push,in-app --path examples/notifications
```

This creates a notification with all available channel methods.

## Using Generated Notifications

After generating a notification, you can use it in your application:

```typescript
import { NotificationManager, NotificationChannel } from '@townkrier/core';
import { WelcomeEmailNotification } from './notifications/WelcomeEmail.notification';

// Setup notification manager (see complete-example.ts for full setup)
const manager = new NotificationManager(config);

// Create and send notification
const notification = new WelcomeEmailNotification();
const recipient = {
  [NotificationChannel.EMAIL]: { email: 'user@example.com', name: 'John Doe' },
};

await manager.send(notification, recipient);
```

## Customizing Generated Notifications

After generating a notification, you'll need to customize it:

1. **Update the constructor** to accept any data needed
2. **Implement the channel methods** with your actual content
3. **Set the appropriate priority** for your use case

Example customization:

```typescript
export class WelcomeEmailNotification extends Notification {
  constructor(
    private userName: string,
    private appUrl: string,
  ) {
    super();
    this.priority = NotificationPriority.HIGH;
  }

  via(): NotificationChannel[] {
    return [NotificationChannel.EMAIL];
  }

  toEmail() {
    return {
      subject: `Welcome to our platform, ${this.userName}!`,
      html: `
        <h1>Welcome ${this.userName}!</h1>
        <p>We're excited to have you on board.</p>
        <a href="${this.appUrl}">Get Started</a>
      `,
      text: `Welcome ${this.userName}! Visit ${this.appUrl} to get started.`,
    };
  }
}
```

## CLI Command Reference

```
townkrier make:notification <name> [options]

Arguments:
  name                       Notification name (e.g., WelcomeUser, OrderConfirmation)

Options:
  -c, --channels <channels>  Comma-separated list: email,sms,push,in-app
  -p, --path <path>          Custom output path (default: ./notifications)
  -f, --force                Overwrite existing file
  -h, --help                 Display help
```

## Available Channels

| Channel | Description                   | Method Generated |
| ------- | ----------------------------- | ---------------- |
| email   | Email notifications           | `toEmail()`      |
| sms     | SMS notifications             | `toSms()`        |
| push    | Push notifications            | `toPush()`       |
| in-app  | In-app/Database notifications | `toInApp()`      |

## Tips

1. **Naming Convention**: Use descriptive names like `OrderConfirmed`, `PaymentReceived`, `PasswordReset`
2. **Channel Selection**: Only include channels you actually plan to use
3. **Custom Paths**: Organize notifications by feature: `--path ./src/features/orders/notifications`
4. **Version Control**: Commit generated notifications as-is first, then customize in separate commits
5. **Reusable Templates**: Create your own notification templates by copying and modifying generated ones

## Examples in This Repository

Check the `examples/notifications/` directory for sample generated notifications.
