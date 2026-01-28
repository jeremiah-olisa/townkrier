# townkrier-storage

Storage adapters for TownKrier notification logs and history.

## Features

- 📊 **Notification Logging**: Store complete notification history
- 🔍 **Search & Filter**: Query logs by status, channel, date, recipient
- 📈 **Analytics**: Track delivery rates, failures, and retry attempts
- 🔒 **Privacy**: Configurable content masking for sensitive data
- 💾 **Multiple Adapters**: In-memory, database, and cloud storage

## Installation

```bash
npm install townkrier-storage
```

## Usage

```typescript
import { StorageManager, InMemoryStorageAdapter } from 'townkrier-storage';

// Create storage adapter
const storageAdapter = new InMemoryStorageAdapter();

// Create storage manager
const storageManager = new StorageManager(storageAdapter);

// Log a notification
await storageManager.logNotification({
  notificationId: 'abc123',
  channel: 'email',
  recipient: 'user@example.com',
  status: 'sent',
  sentAt: new Date(),
});
```

## License

MIT
