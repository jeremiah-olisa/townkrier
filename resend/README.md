# @townkrier/resend

Resend email adapter for the Townkrier notification system.

## Installation

```bash
npm install @townkrier/resend @townkrier/core
# or
pnpm add @townkrier/resend @townkrier/core
```

## Usage

```typescript
import { NotificationManager } from '@townkrier/core';
import { createResendChannel, ResendConfig } from '@townkrier/resend';

// Create Resend channel
const resendConfig: ResendConfig = {
  apiKey: 'your-resend-api-key',
  from: 'noreply@yourdomain.com',
  fromName: 'Your App',
};

const resendChannel = createResendChannel(resendConfig);

// Register with notification manager
const manager = new NotificationManager();
manager.registerChannel('email', resendChannel);

// Send email
await resendChannel.sendEmail({
  from: { email: 'noreply@yourdomain.com', name: 'Your App' },
  to: { email: 'user@example.com', name: 'John Doe' },
  subject: 'Welcome!',
  html: '<p>Welcome to our app!</p>',
  text: 'Welcome to our app!',
});
```

## Configuration

- `apiKey` (required): Your Resend API key
- `from` (optional): Default from email address
- `fromName` (optional): Default from name
- `timeout` (optional): Request timeout in milliseconds
- `debug` (optional): Enable debug logging

## License

MIT
