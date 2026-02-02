# townkrier-whapi

WHAPI.cloud WhatsApp adapter for the TownKrier notification system.

## Features

- 📱 WhatsApp Business API integration via WHAPI.cloud
- 🌍 Support for international messaging
- 🔄 Automatic retry and error handling
- 📝 Rich text message support
- 🔍 Message delivery tracking
- 🛡️ Type-safe configuration

## Installation

```bash
npm install townkrier-whapi townkrier-core
# or
pnpm add townkrier-whapi townkrier-core
```

## Quick Start

```typescript
import { NotificationManager } from 'townkrier-core';
import { createWhapiAdapter, WhapiConfig } from 'townkrier-whapi';

// Configure WHAPI adapter
const whapiConfig: WhapiConfig = {
  apiKey: process.env.WHAPI_API_KEY,
  baseUrl: 'https://gate.whapi.cloud', // Optional, defaults to this URL
};

// Create the adapter
const whapiAdapter = createWhapiAdapter(whapiConfig);

// Use with NotificationManager
const manager = new NotificationManager();

// Send a WhatsApp message
const result = await whapiAdapter.send({
  to: { phone: '+1234567890' },
  text: 'Hello from TownKrier via WHAPI!',
});

console.log('Message sent:', result.messageId);
```

## Configuration

### WhapiConfig

```typescript
interface WhapiConfig extends NotificationChannelConfig {
  apiKey: string; // Required: Your WHAPI API key
  baseUrl?: string; // Optional: API base URL (default: 'https://gate.whapi.cloud')
}
```

## Environment Variables

```bash
WHAPI_API_KEY=your_api_key_here
```

## Usage with NotificationManager

```typescript
import { NotificationManager, NotificationChannel } from 'townkrier-core';
import { createWhapiAdapter } from 'townkrier-whapi';

const manager = new NotificationManager({
  defaultChannel: 'whatsapp-whapi',
  channels: [
    {
      name: 'whatsapp-whapi',
      enabled: true,
      config: {
        apiKey: process.env.WHAPI_API_KEY,
        baseUrl: 'https://gate.whapi.cloud',
      },
    },
  ],
});

// Register the factory
manager.registerFactory('whatsapp-whapi', createWhapiAdapter);

// Send notification
await manager.send({
  channel: 'whatsapp-whapi',
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
- **API-specific errors**: WHAPI error responses

```typescript
try {
  const result = await whapiAdapter.send({
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

### createWhapiAdapter(config)

Factory function to create a WHAPI adapter instance.

**Parameters:**

- `config` (WhapiConfig): Configuration object

**Returns:** `WhapiAdapter` instance

### WhapiAdapter

#### send(request)

Send a WhatsApp message.

**Parameters:**

- `request` (WhatsAppRequest): Message request object

**Returns:** `Promise<WhatsAppResponse>`

## Rate Limits

Be aware of WHAPI.cloud's rate limits:

- Messages per minute: Varies by plan
- Messages per hour: Varies by plan
- Messages per day: Varies by plan

The adapter does not implement rate limiting - consider using TownKrier's queue system for production use.

## WHAPI Response Format

WHAPI returns messages in this format:

```json
{
  "sent": true,
  "message": {
    "id": "message_id_here",
    "message_id": "alternative_id"
  }
}
```

The adapter extracts the message ID from either `message.id` or `message.message_id` fields.

## Error Response Handling

WHAPI error responses include detailed error information:

```json
{
  "error": {
    "code": 400,
    "message": "Invalid phone number",
    "details": "Phone number must be in international format",
    "href": "https://docs.whapi.cloud/errors",
    "support": "support@whapi.cloud"
  }
}
```

The adapter logs these errors and returns a failed status.

## Support

For issues specific to the WHAPI adapter:

1. Check your API key and configuration
2. Verify phone numbers are in international format
3. Review WHAPI.cloud API documentation
4. Check TownKrier logs for detailed error messages

## License

MIT
