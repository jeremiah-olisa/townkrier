# Message Mappers Examples

This directory contains examples demonstrating the **message mapper pattern** for handling multiple drivers with different message interfaces.

## Problem

Different drivers expect different message formats:

```typescript
// Whapi WhatsApp driver expects:
interface WhapiMessage {
  to: string;
  body: string;        // Note: 'body' not 'text'
  media?: string;
}

// WaSender WhatsApp driver expects:
interface WaSendApiMessage {
  to: string;
  msg: string;         // Note: 'msg' not 'text'
  url?: string;        // Note: 'url' not 'media'
}

// How do you write ONE notification that works with both?
```

## Solution: Message Mappers

Define your own unified message format and let mappers handle the transformation:

```
Your Unified Format
    ↓
Notification.toWhatsapp() returns UnifiedMessage
    ↓
Framework applies the appropriate mapper
    ↓
Driver receives driver-specific format ✅
```

## Files in This Directory

### 1. [unified-whatsapp.interface.ts](./unified-whatsapp.interface.ts)

Defines the **unified WhatsApp message format** that your notifications will use.

```typescript
export interface UnifiedWhatsappMessage {
  to: string;           // Phone number
  text: string;         // Message text
  media?: string;       // URL to media (image, video, document)
  caption?: string;     // Caption for media
  type?: 'text' | 'image' | 'video';  // Message type
}
```

**Why this format?**
- Combines the best of all driver interfaces
- User-defined (you can customize as needed)
- No conflict with driver-specific field names

### 2. [whatsapp.mappers.ts](./whatsapp.mappers.ts)

Implements **mapper classes** that transform `UnifiedWhatsappMessage` to driver-specific formats.

```typescript
// Each mapper implements MessageMapper<Input, Output>
export class WhapiMessageMapper implements MessageMapper<UnifiedWhatsappMessage, WhapiMessage> {
  map(message: UnifiedWhatsappMessage): WhapiMessage {
    return {
      to: message.to,
      body: message.text,  // Transform 'text' → 'body'
      media: message.media,
      caption: message.caption,
      type: message.type,
    };
  }
}

export class WaSendApiMessageMapper implements MessageMapper<UnifiedWhatsappMessage, WaSendApiMessage> {
  map(message: UnifiedWhatsappMessage): WaSendApiMessage {
    return {
      to: message.to,
      msg: message.text,   // Transform 'text' → 'msg'
      url: message.media,  // Transform 'media' → 'url'
      type: message.type as any,
    };
  }
}
```

### 3. [whatsapp-only.notification.ts](../notifications/whatsapp-only.notification.ts)

**Without mappers** - Use this when you only use a single driver.

```typescript
export class WhatsappOnlyNotification extends Notification<'whatsapp'> {
  toWhatsapp(notifiable: Notifiable): WhapiMessage {  // Type locked to driver
    return {
      to: phone,
      body: 'Message text',  // Must use driver-specific field names
    };
  }
}
```

**Trade-off:** Simpler (no mappers), but locked to one driver format

### 4. [whatsapp-with-mapper.notification.ts](./whatsapp-with-mapper.notification.ts)

**With mappers** - Use this when you need to support multiple drivers.

```typescript
export class WhatsappWithMapperNotification extends Notification<'whatsapp'> {
  toWhatsapp(notifiable: Notifiable): UnifiedWhatsappMessage {  // User-defined type
    return {
      to: phone,
      text: 'Message text',  // Unified field name
      // ✅ No need to know driver-specific formats!
      // ✅ Mappers handle transformation automatically!
    };
  }
}
```

**Trade-off:** Requires setup, but flexible and type-safe

## Configuration Example

See [whatsapp-with-mapper-config.ts](../whatsapp-with-mapper-config.ts) for a complete setup example:

```typescript
// Register drivers with mappers
const fallbackConfig: FallbackStrategyConfig = {
  strategy: 'priority-fallback',
  drivers: [
    {
      driver: new WhapiDriver(config),
      mapper: new WhapiMessageMapper(),      // Registered once!
    },
    {
      driver: new WaSendApiDriver(config),
      mapper: new WaSendApiMessageMapper(),  // Registered once!
    },
  ],
};
```

## Step-by-Step Usage

### Step 1: Define Your Unified Format

```typescript
// Choose field names that make sense for your domain
export interface UnifiedMessage {
  to: string;
  text: string;
  // ... other fields
}
```

### Step 2: Create Mappers

```typescript
export class MyDriverMapper implements MessageMapper<UnifiedMessage, MyDriverMessage> {
  map(msg: UnifiedMessage): MyDriverMessage {
    return {
      // Transform fields as needed
      recipient: msg.to,
      content: msg.text,
    };
  }
}
```

### Step 3: Register During Setup

```typescript
const config = {
  drivers: [
    {
      driver: new MyDriver(cfg),
      mapper: new MyDriverMapper(),  // ← Register here
    },
  ],
};
```

### Step 4: Use in Notifications

```typescript
class MyNotification extends Notification<'channel'> {
  toChannel(notifiable: Notifiable): UnifiedMessage {
    // Return your unified format
    // Mappers handle transformation automatically
    return { to: '...', text: '...' };
  }
}
```

## Benefits

| Benefit | Without Mappers | With Mappers |
|---------|-----------------|--------------|
| **Type Safety** | ❌ Need 'as any' casts | ✅ Fully type-safe |
| **Single Driver** | ✅ Simple, no setup | ❌ Unnecessary complexity |
| **Multiple Drivers** | ❌ Type conflicts | ✅ Clean, unified format |
| **Flexibility** | ❌ Locked to driver format | ✅ Define your own format |
| **Maintainability** | ❌ Notifications know driver details | ✅ Notifications decoupled |
| **Reusability** | ❌ Per-notification transformation | ✅ Mapper used everywhere |

## Decision Tree

**Should you use mappers?**

```
Are you using multiple drivers? 
  ├─ NO → Use single driver format directly (simpler)
  └─ YES → Do they have the same message interface?
       ├─ YES → No mappers needed
       └─ NO → Use mappers (type-safe) ✅
```

## Common Scenarios

### Email with Multiple Providers

You could create mappers for:
- Resend (uses `subject`, `html`)
- Postmark (uses `Subject`, `HtmlBody`)
- Mailtrap (uses `Subject`, `Html`)

### SMS with Multiple Providers

Providers might differ in:
- `to` vs `recipient` vs `phone_number`
- Character limits
- Encoding requirements

### Push with Multiple Providers

FCM vs APNs vs OneSignal may have different:
- Payload structures
- Token formats
- Metadata fields

## Advanced Patterns

### Conditional Mapping

```typescript
class SmartMapper implements MessageMapper<Unified, DriverFormat> {
  map(msg: Unified): DriverFormat {
    if (msg.priority === 'high') {
      return { ...transform(msg), urgent: true };
    }
    return transform(msg);
  }
}
```

### Chained Mappers

```typescript
// First mapper: Unified → Intermediate
// Second mapper: Intermediate → Driver-specific
class ChainedMapper {
  constructor(
    private mapper1: MessageMapper<Unified, Intermediate>,
    private mapper2: MessageMapper<Intermediate, DriverFormat>
  ) {}

  map(msg: Unified): DriverFormat {
    const intermediate = this.mapper1.map(msg);
    return this.mapper2.map(intermediate);
  }
}
```

## Testing Mappers

```typescript
describe('WhapiMessageMapper', () => {
  it('should transform unified message to Whapi format', () => {
    const mapper = new WhapiMessageMapper();
    const unified: UnifiedWhatsappMessage = {
      to: '+1234567890',
      text: 'Hello!',
      media: 'https://example.com/image.jpg',
    };

    const result = mapper.map(unified);

    expect(result.to).toBe('+1234567890');
    expect(result.body).toBe('Hello!');        // 'text' → 'body'
    expect(result.media).toBe('https://example.com/image.jpg');
  });
});
```

## Documentation References

- [Core Mappers Documentation](../../packages/core/README.md#message-mappers)
- [Usage Guide](../../USAGE.md#message-mappers-multi-driver-scenarios)
- [Architecture](../../ARCHITECTURE.md#4-message-mappers-multi-driver-support)
- [Quick Start](../../QUICKSTART.md#step-7-using-multiple-drivers-with-mappers)
