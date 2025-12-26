# CLI Quick Start Guide

## 🚀 Setup

### Option 1: Use Directly from Workspace (Recommended for Development)

```bash
# From the root of the TownKrier project
cd packages/cli

# Build the CLI
pnpm build

# Use it directly
node bin/townkrier.js make:notification YourNotification --channels email
```

### Option 2: Link Globally

```bash
# From the CLI package directory
cd packages/cli
pnpm link --global

# Now use it from anywhere
townkrier make:notification WelcomeUser --channels email,sms
```

### Option 3: Use with pnpm in monorepo

```bash
# From the root of the TownKrier project
pnpm --filter @townkrier/cli exec townkrier make:notification MyNotification --channels email
```

## 📝 Usage Examples

### 1. Interactive Mode

```bash
# Will prompt you to select channels
node bin/townkrier.js make:notification WelcomeUser
```

### 2. With Specific Channels

```bash
# Email only
node bin/townkrier.js make:notification OrderConfirmation --channels email

# Multiple channels
node bin/townkrier.js make:notification AlertNotification --channels email,sms,push

# All channels
node bin/townkrier.js make:notification ImportantAlert --channels email,sms,push,in-app
```

### 3. Custom Output Path

```bash
# Generate in a specific directory
node bin/townkrier.js make:notification UserInvite --channels email --path ./src/notifications

# For NestJS project
node bin/townkrier.js make:notification PaymentReceived --channels email,sms --path ./src/app/notifications
```

### 4. Force Overwrite

```bash
# Overwrite existing file without prompting
node bin/townkrier.js make:notification Welcome --channels email --force
```

## 🎯 Generated File Structure

When you run:

```bash
node bin/townkrier.js make:notification OrderConfirmation --channels email,sms
```

It generates: `OrderConfirmation.notification.ts`

```typescript
import { Notification, NotificationChannel, NotificationPriority } from '@townkrier/core';

export class OrderConfirmationNotification extends Notification {
  constructor() {
    super();
    this.priority = NotificationPriority.NORMAL;
  }

  via(): NotificationChannel[] {
    return [NotificationChannel.EMAIL, NotificationChannel.SMS];
  }

  toEmail() {
    return {
      subject: 'Your notification subject',
      html: '<h1>Your notification content</h1>',
      text: 'Your notification content',
    };
  }

  toSms() {
    return {
      text: 'Your SMS message text',
    };
  }
}
```

## 🔧 Using Generated Notifications

```typescript
import { NotificationManager } from '@townkrier/core';
import { OrderConfirmationNotification } from './notifications/OrderConfirmation.notification';

const manager = new NotificationManager(config);

// Create notification instance
const notification = new OrderConfirmationNotification();

// Define recipient
const recipient = {
  [NotificationChannel.EMAIL]: { email: 'user@example.com' },
  [NotificationChannel.SMS]: { phoneNumber: '+1234567890' },
};

// Send notification
await manager.send(notification, recipient);
```

## 📦 Available Channels

- **email** - Email notifications via configured email provider
- **sms** - SMS notifications via configured SMS provider
- **push** - Push notifications via configured push provider
- **in-app** - In-app/Database notifications

## 💡 Tips

1. **Naming Convention**: The CLI automatically adds "Notification" suffix to your class name
   - Input: `WelcomeUser` → Output: `WelcomeUserNotification`
   - Input: `OrderConfirmation` → Output: `OrderConfirmationNotification`

2. **Default Path**: If you don't specify a path, it will create notifications in:
   - `./src/notifications/` (if src directory exists)
   - `./notifications/` (otherwise)

3. **File Naming**: Files are always named with `.notification.ts` extension
   - Class: `WelcomeUser` → File: `WelcomeUser.notification.ts`

## 🐛 Troubleshooting

### "Command not found: townkrier"

If you linked globally and still can't use the command:

```bash
# Re-link the package
cd packages/cli
pnpm unlink --global
pnpm link --global
```

### "Cannot find module '@townkrier/core'"

Make sure to build the core package first:

```bash
# From root directory
pnpm build:core
```

### Permission Denied

If you get permission errors when writing files:

```bash
# Make sure the output directory is writable
mkdir -p ./notifications
chmod 755 ./notifications
```

## 📚 More Resources

- [Full CLI Documentation](./README.md)
- [TownKrier Core Documentation](../core/README.md)
- [Examples](../../examples/)
