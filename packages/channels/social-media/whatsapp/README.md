# WhatsApp Channels

This directory contains WhatsApp adapter implementations for the TownKrier notification system.

## Available Adapters

### 📦 townkrier-whatsapp-common

Shared interfaces and base classes for WhatsApp channels.

### 📦 townkrier-wasender

WhatsApp adapter for [Wasender API](https://wasenderapi.com).

**Features:**

- Simple API integration
- Customizable base URL
- Optional sender ID support

### 📦 townkrier-whapi

WhatsApp adapter for [WHAPI.cloud](https://whapi.cloud).

**Features:**

- Comprehensive error handling
- Detailed API response parsing
- Support for WHAPI-specific features

## Quick Comparison

| Feature           | Wasender        | WHAPI       |
| ----------------- | --------------- | ----------- |
| API Provider      | wasenderapi.com | whapi.cloud |
| Setup Complexity  | Simple          | Simple      |
| Error Details     | Basic           | Detailed    |
| Custom Base URL   | ✅              | ✅          |
| Sender ID Support | ✅              | ❌          |

## Installation

```bash
# Install all WhatsApp packages
npm install townkrier-wasender townkrier-whapi townkrier-core
# or
pnpm add townkrier-wasender townkrier-whapi townkrier-core
```

## Basic Usage

### Using Wasender

```typescript
import { createWasenderAdapter } from 'townkrier-wasender';

const adapter = createWasenderAdapter({
  apiKey: process.env.WASENDER_API_KEY,
});

await adapter.send({
  to: { phone: '+1234567890' },
  text: 'Hello from Wasender!',
});
```

### Using WHAPI

```typescript
import { createWhapiAdapter } from 'townkrier-whapi';

const adapter = createWhapiAdapter({
  apiKey: process.env.WHAPI_API_KEY,
});

await adapter.send({
  to: { phone: '+1234567890' },
  text: 'Hello from WHAPI!',
});
```

## Integration with NotificationManager

```typescript
import { NotificationManager } from 'townkrier-core';
import { createWasenderAdapter } from 'townkrier-wasender';
import { createWhapiAdapter } from 'townkrier-whapi';

const manager = new NotificationManager({
  channels: [
    {
      name: 'whatsapp-wasender',
      config: { apiKey: process.env.WASENDER_API_KEY },
    },
    {
      name: 'whatsapp-whapi',
      config: { apiKey: process.env.WHAPI_API_KEY },
    },
  ],
});

// Register factories
manager.registerFactory('whatsapp-wasender', createWasenderAdapter);
manager.registerFactory('whatsapp-whapi', createWhapiAdapter);

// Send via specific adapter
await manager.send({
  channel: 'whatsapp-wasender',
  to: { phone: '+1234567890' },
  text: 'Hello World!',
});
```

## Development

### Building

```bash
# Build all packages
pnpm --filter "townkrier-whatsapp-*" build

# Build individual packages
pnpm --filter townkrier-whatsapp-common build
pnpm --filter townkrier-wasender build
pnpm --filter townkrier-whapi build
```

### Testing

```bash
# Test all packages
pnpm --filter "townkrier-whatsapp-*" test

# Test individual packages
pnpm --filter townkrier-wasender test
pnpm --filter townkrier-whapi test
```

## Contributing

When adding new WhatsApp adapters:

1. Create a new package in this directory
2. Extend `WhatsAppChannel` from `townkrier-whatsapp-common`
3. Follow the existing patterns for configuration and error handling
4. Add comprehensive tests
5. Update this README with the new adapter

## License

MIT
