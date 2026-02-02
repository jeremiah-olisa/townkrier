# townkrier-whatsapp-common

Common interfaces and base classes for WhatsApp channels in the TownKrier notification system.

## Overview

This package provides the shared foundation for all WhatsApp adapters in TownKrier. It includes:

- `WhatsAppChannel` - Abstract base class for WhatsApp implementations
- `WhatsAppRequest` - Interface for WhatsApp message requests
- `WhatsAppResponse` - Interface for WhatsApp message responses

## Installation

```bash
npm install townkrier-whatsapp-common townkrier-core
# or
pnpm add townkrier-whatsapp-common townkrier-core
```

## Usage

This package is typically used by WhatsApp adapter implementations. For end users, you should use specific adapter packages like:

- [townkrier-wasender](https://github.com/your-org/townkrier/tree/main/packages/channels/social-media/whatsapp/wasender)
- [townkrier-whapi](https://github.com/your-org/townkrier/tree/main/packages/channels/social-media/whatsapp/whapi)

## Interfaces

### WhatsAppRequest

```typescript
interface WhatsAppRequest {
  to: {
    phone: string; // Phone number in international format (e.g., "+1234567890")
  };
  text: string; // Message content
  [key: string]: any; // Additional provider-specific options
}
```

### WhatsAppResponse

```typescript
interface WhatsAppResponse {
  messageId: string; // Provider's message ID
  status: NotificationStatus; // SENT, FAILED, etc.
  sentAt: Date; // Timestamp when message was sent
  rawResponse?: any; // Raw response from provider (optional)
}
```

## Contributing

When creating new WhatsApp adapters, extend the `WhatsAppChannel` class:

```typescript
import { WhatsAppChannel, WhatsAppRequest, WhatsAppResponse } from 'townkrier-whatsapp-common';

export class MyWhatsAppAdapter extends WhatsAppChannel {
  async send(request: WhatsAppRequest): Promise<WhatsAppResponse> {
    // Implementation here
  }
}
```

## License

MIT
