# Driver Configuration Examples

All TownKrier drivers now support a static `configure()` method that allows for clean, type-safe configuration. This method accepts the driver's configuration object and returns it, ensuring proper typing throughout your application.

## Usage Pattern

```typescript
import { TownKrier } from 'townkrier-core';
import { ResendDriver, MailtrapDriver } from 'townkrier-channels';

const townkrier = TownKrier.create({
    channels: {
        email: {
            drivers: [
                {
                    use: ResendDriver,
                    config: ResendDriver.configure({
                        apiKey: process.env.RESEND_API_KEY!,
                        from: 'notifications@example.com'
                    }),
                    priority: 10,
                },
                {
                    use: MailtrapDriver,
                    config: MailtrapDriver.configure({
                        token: process.env.MAILTRAP_TOKEN!,
                        from: { 
                            email: 'test@example.com', 
                            name: 'Test App' 
                        }
                    }),
                    priority: 8,
                },
            ],
        },
    },
});
```

## Available Drivers

### Email Drivers

#### ResendDriver
```typescript
ResendDriver.configure({
    apiKey: string;
    from?: string;
})
```

#### MailtrapDriver
```typescript
MailtrapDriver.configure({
    token: string;
    endpoint?: string;
    testInboxId?: number;
    accountId?: number;
    from?: { email: string; name?: string };
})
```

#### PostmarkDriver
```typescript
PostmarkDriver.configure({
    serverToken: string;
    from?: string;
})
```

#### SmtpDriver
```typescript
SmtpDriver.configure({
    host: string;
    port: number;
    secure?: boolean;
    auth?: {
        user: string;
        pass: string;
    };
    from?: string;
    fromName?: string;
})
```

### In-App Drivers

#### DatabaseDriver
```typescript
DatabaseDriver.configure({
    storageAdapter: InAppStorageAdapter;
})
```

#### SseDriver
```typescript
SseDriver.configure({
    heartbeatInterval?: number;
    maxConnections?: number;
    eventType?: string;
})
```

### Push Notification Drivers

#### ExpoDriver
```typescript
ExpoDriver.configure({
    accessToken?: string;
    useFcmV1?: boolean;
})
```

#### FcmDriver
```typescript
FcmDriver.configure({
    serviceAccount?: ServiceAccount;
    serviceAccountPath?: string;
    projectId?: string;
    databaseURL?: string;
})
```

### SMS Drivers

#### TermiiDriver
```typescript
TermiiDriver.configure({
    apiKey: string;
    baseUrl?: string;
    from?: string;
    channel?: 'dnd' | 'whatsapp' | 'generic';
    type?: 'plain' | 'byte';
    media?: {
        url: string;
        caption: string;
    };
    timeout?: number;
})
```

### WhatsApp Drivers

#### WhapiDriver
```typescript
WhapiDriver.configure({
    apiKey: string;
    baseUrl?: string;
})
```

#### WaSendApiDriver
```typescript
WaSendApiDriver.configure({
    apiKey: string;
    device: string;
    gateway?: string;
    baseUrl?: string;
})
```

## Benefits

1. **Type Safety**: Full TypeScript support with autocomplete for configuration options
2. **Consistency**: Uniform API across all drivers
3. **Clarity**: Makes driver configuration explicit and easy to understand
4. **Validation**: Configuration objects are properly typed and validated by TypeScript

## Complete Example

```typescript
import { TownKrier } from 'townkrier-core';
import { 
    ResendDriver, 
    SmtpDriver,
    DatabaseDriver,
    ExpoDriver,
    TermiiDriver 
} from 'townkrier-channels';

const townkrier = TownKrier.create({
    channels: {
        email: {
            drivers: [
                {
                    use: ResendDriver,
                    config: ResendDriver.configure({
                        apiKey: process.env.RESEND_API_KEY!,
                        from: 'notifications@example.com'
                    }),
                    priority: 10,
                },
                {
                    use: SmtpDriver,
                    config: SmtpDriver.configure({
                        host: 'smtp.gmail.com',
                        port: 587,
                        secure: false,
                        auth: {
                            user: process.env.SMTP_USER!,
                            pass: process.env.SMTP_PASS!,
                        },
                        from: 'fallback@example.com'
                    }),
                    priority: 5,
                },
            ],
        },
        inApp: {
            drivers: [
                {
                    use: DatabaseDriver,
                    config: DatabaseDriver.configure({
                        storageAdapter: myStorageAdapter
                    }),
                },
            ],
        },
        push: {
            drivers: [
                {
                    use: ExpoDriver,
                    config: ExpoDriver.configure({
                        accessToken: process.env.EXPO_ACCESS_TOKEN,
                        useFcmV1: true
                    }),
                },
            ],
        },
        sms: {
            drivers: [
                {
                    use: TermiiDriver,
                    config: TermiiDriver.configure({
                        apiKey: process.env.TERMII_API_KEY!,
                        from: 'MyApp',
                        channel: 'generic',
                        type: 'plain'
                    }),
                },
            ],
        },
    },
});
```
