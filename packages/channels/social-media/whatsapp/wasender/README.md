# townkrier-wasender

Wasender WhatsApp adapter for the TownKrier notification system.

## Features

- 📱 WhatsApp Business API integration via Wasender
- 🌍 Support for international messaging
- 🔄 Automatic retry and error handling
- 📝 Rich text message support
- 🔍 Message delivery tracking
- 🛡️ Type-safe configuration

## Installation

```bash
npm install townkrier-wasender townkrier-core
# or
pnpm add townkrier-wasender townkrier-core
```

## Quick Start

```typescript
import { NotificationManager } from 'townkrier-core';
import { createWasenderAdapter, WasenderConfig } from 'townkrier-wasender';

// Configure Wasender adapter
const wasenderConfig: WasenderConfig = {
  apiKey: process.env.WASENDER_API_KEY,
  baseUrl: 'https://wasenderapi.com/api', // Optional, defaults to this URL
  senderId: 'YourSenderId', // Optional sender ID
};

// Create the adapter
const wasenderAdapter = createWasenderAdapter(wasenderConfig);

// Use with NotificationManager
const manager = new NotificationManager();

// Send a WhatsApp message
const result = await wasenderAdapter.send({
  to: { phone: '+1234567890' },
  text: 'Hello from TownKrier via Wasender!',
});

console.log('Message sent:', result.messageId);
```

## Configuration

### WasenderConfig

```typescript
interface WasenderConfig extends NotificationChannelConfig {
  apiKey: string; // Required: Your Wasender API key
  baseUrl?: string; // Optional: API base URL (default: 'https://wasenderapi.com/api')
  senderId?: string; // Optional: Sender ID for your messages
}
```

## Environment Variables

```bash
WASENDER_API_KEY=your_api_key_here
```

## Usage with NotificationManager

```typescript
import { NotificationManager, NotificationChannel } from 'townkrier-core';
import { createWasenderAdapter } from 'townkrier-wasender';

const manager = new NotificationManager({
  defaultChannel: 'whatsapp-wasender',
  channels: [
    {
      name: 'whatsapp-wasender',
      enabled: true,
      config: {
        apiKey: process.env.WASENDER_API_KEY,
        baseUrl: 'https://wasenderapi.com/api',
      },
    },
  ],
});

// Register the factory
manager.registerFactory('whatsapp-wasender', createWasenderAdapter);

// Send notification
await manager.send({
  channel: 'whatsapp-wasender',
  to: { phone: '+1234567890' },
  text: 'Welcome to our service!',
});
```

## Error Handling

The adapter handles various error scenarios:

- **Authentication errors**: Invalid API key
- **Rate limiting**: Automatic retry with backoff
- **Network issues**: Timeout and connection errors
- **Invalid recipients**: Phone number validation

```typescript
try {
  const result = await wasenderAdapter.send({
    to: { phone: '+1234567890' },
    text: 'Test message',
  });

  if (result.status === 'FAILED') {
    console.error('Message failed to send');
  }
} catch (error) {
  console.error('Adapter error:', error);
}
```

## API Reference

### createWasenderAdapter(config)

Factory function to create a Wasender adapter instance.

**Parameters:**

- `config` (WasenderConfig): Configuration object

**Returns:** `WasenderAdapter` instance

### WasenderAdapter

#### send(request)

Send a WhatsApp message.

**Parameters:**

- `request` (WhatsAppRequest): Message request object

**Returns:** `Promise<WhatsAppResponse>`

## Rate Limits

Be aware of Wasender's rate limits:

- Messages per minute: Varies by plan
- Messages per hour: Varies by plan
- Messages per day: Varies by plan

The adapter does not implement rate limiting - consider using TownKrier's queue system for production use.

## Support

For issues specific to the Wasender adapter:

1. Check your API key and configuration
2. Verify phone numbers are in international format
3. Review Wasender API documentation
4. Check TownKrier logs for detailed error messages

## License

MIT
