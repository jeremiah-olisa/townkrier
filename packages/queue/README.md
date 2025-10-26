# @townkrier/queue

Queue adapter system for TownKrier notifications with retry capabilities, similar to Hangfire.

## Features

- 🔄 **Retry Logic**: Configurable retry attempts with exponential backoff
- 🎯 **Multiple Adapters**: Support for different queue backends (in-memory, Redis, etc.)
- 📊 **Job Tracking**: Track job status, attempts, and execution history
- ⏰ **Delayed Jobs**: Schedule notifications for future delivery
- 🔍 **Job Management**: List, retry, and delete jobs

## Installation

```bash
npm install @townkrier/queue
```

## Usage

```typescript
import { QueueManager, InMemoryQueueAdapter } from '@townkrier/queue';
import { NotificationManager } from '@townkrier/core';

// Create queue adapter
const queueAdapter = new InMemoryQueueAdapter({
  maxRetries: 3,
  retryDelay: 1000,
});

// Create queue manager
const queueManager = new QueueManager(queueAdapter);

// Send notification to queue (background)
await queueManager.enqueue(notification, recipient);

// Send notification immediately
await queueManager.enqueueNow(notification, recipient);
```

## License

MIT
