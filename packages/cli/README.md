# @townkrier/cli

CLI tooling for TownKrier notification system - Laravel-style commands for generating notification classes.

## Installation

```bash
# Install globally
npm install -g @townkrier/cli

# Or install as a dev dependency in your project
npm install --save-dev @townkrier/cli
```

## Usage

### Generate a Notification

The `make:notification` command creates a new notification class with the specified channels.

```bash
# Interactive mode - prompts for channel selection
townkrier make:notification WelcomeUser

# With specific channels
townkrier make:notification OrderConfirmation --channels email,sms

# With all channels
townkrier make:notification ImportantAlert --all-channels

# Custom output path
townkrier make:notification UserInvite --path ./src/app/notifications

# Force overwrite existing file
townkrier make:notification Welcome --force
```

### Command Options

```
townkrier make:notification <name> [options]

Arguments:
  name                     Name of the notification (e.g., WelcomeUser, OrderConfirmation)

Options:
  -c, --channels <channels>  Comma-separated list of channels (email,sms,push,in-app)
  -a, --all-channels         Include all available channels
  -p, --path <path>          Custom path for the notification file
  -f, --force                Overwrite existing notification file
  -h, --help                 Display help for command
```

## Available Channels

- **email** - Email notifications via configured email provider
- **sms** - SMS notifications via configured SMS provider
- **push** - Push notifications via configured push provider
- **in-app** - In-app/Database notifications

## Generated Notification Structure

The CLI generates a TypeScript notification class that extends the `Notification` base class from `@townkrier/core`.

### Naming Convention

- **Input**: `WelcomeUser`
- **Generated File**: `WelcomeUser.notification.ts`
- **Generated Class**: `WelcomeUserNotification` (automatically adds "Notification" suffix)

### Example Structure

```typescript
import { Notification, NotificationChannel, NotificationPriority } from '@townkrier/core';

export class WelcomeUserNotification extends Notification {
  constructor() {
    super();
    this.priority = NotificationPriority.NORMAL;
  }

  via(): NotificationChannel[] {
    return [NotificationChannel.EMAIL];
  }

  toEmail() {
    return {
      subject: 'Your notification subject',
      html: '<h1>Your notification content</h1>',
      text: 'Your notification content',
    };
  }
}
```

## Examples

### Example 1: Welcome Email

```bash
townkrier make:notification WelcomeUser --channels email
```

This generates a notification class in `./notifications/WelcomeUser.notification.ts` with an email channel.

### Example 2: Multi-Channel Order Confirmation

```bash
townkrier make:notification OrderConfirmation --channels email,sms,push
```

This generates a notification with `toEmail()`, `toSms()`, and `toPush()` methods.

### Example 3: Custom Path

```bash
townkrier make:notification PasswordReset --channels email --path ./src/notifications
```

This generates the notification in the specified custom path.

## Integration with TownKrier

After generating a notification, you can use it with the TownKrier notification manager:

```typescript
import { NotificationManager } from '@townkrier/core';
import { WelcomeUserNotification } from './notifications/WelcomeUser.notification';

const manager = new NotificationManager(config);

// Send the notification
const notification = new WelcomeUserNotification();
const recipient = {
  [NotificationChannel.EMAIL]: { email: 'user@example.com' },
};

await manager.send(notification, recipient);
```

## Package Scripts

If installed as a dev dependency, you can add scripts to your `package.json`:

```json
{
  "scripts": {
    "notify:make": "townkrier make:notification"
  }
}
```

Then run:

```bash
npm run notify:make WelcomeUser -- --channels email,sms
```

## License

MIT

## Author

Jeremiah Olisa

## Related Packages

- [@townkrier/core](../core) - Core notification system
- [@townkrier/resend](../resend) - Email provider (Resend)
- [@townkrier/termii](../channels/sms/termii) - SMS provider (Termii)
- [@townkrier/fcm](../channels/push/fcm) - Push provider (Firebase Cloud Messaging)
