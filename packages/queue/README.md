# @townkrier/queue

Queue adapter system for TownKrier notifications with retry capabilities, similar to Hangfire.

## Features

- 🔄 **Retry Logic**: Configurable retry attempts with exponential backoff
- 🎯 **Multiple Adapters**: In-memory and BullMQ (Redis-backed) adapters
- 📊 **Job Tracking**: Track job status, attempts, and execution history
- ⏰ **Delayed Jobs**: Schedule notifications for future delivery
- 🔍 **Job Management**: List, retry, and delete jobs
- 💾 **Persistent Storage**: BullMQ adapter with Redis for production use
- 🔧 **Worker-based Processing**: Efficient background job processing
- 🎨 **Priority Queues**: Support for job priorities (CRITICAL, HIGH, NORMAL, LOW)

## Installation

```bash
npm install @townkrier/queue

# For BullMQ adapter (Redis-backed)
npm install bullmq ioredis
```

## Queue Adapters

### In-Memory Adapter (Development)

Perfect for development and testing:

```typescript
import { QueueManager, InMemoryQueueAdapter } from '@townkrier/queue';
import { NotificationManager } from '@townkrier/core';

const queueAdapter = new InMemoryQueueAdapter({
  maxRetries: 3,
  retryDelay: 1000, // ms
  timeout: 30000, // ms
  pollInterval: 1000, // ms
});

const queueManager = new QueueManager(queueAdapter, notificationManager);
```

### BullMQ Adapter (Production)

Redis-backed persistent queue for production:

```typescript
import { QueueManager, BullMQQueueAdapter } from '@townkrier/queue';

const queueAdapter = new BullMQQueueAdapter({
  redis: {
    host: 'localhost',
    port: 6379,
    password: process.env.REDIS_PASSWORD, // Optional
    db: 0,
    maxRetriesPerRequest: null, // Required for BullMQ
  },
  queueName: 'townkrier-notifications',
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 30000,
  pollInterval: 1000,
});

const queueManager = new QueueManager(queueAdapter, notificationManager);
```

## Basic Usage

### Sending Notifications

```typescript
import { JobPriority } from '@townkrier/queue';

// Send immediately (synchronous)
const result = await queueManager.sendNow(notification, recipient);

// Queue for background processing
const job = await queueManager.enqueue(notification, recipient, {
  priority: JobPriority.HIGH,
  maxRetries: 5,
  metadata: { userId: '123' },
});

// Schedule for future delivery
const scheduledJob = await queueManager.enqueue(notification, recipient, {
  scheduledFor: new Date(Date.now() + 3600000), // 1 hour from now
  priority: JobPriority.CRITICAL,
});
```

### Starting the Queue Processor

```typescript
// Start processing jobs
queueManager.startProcessing({
  pollInterval: 2000, // Check for new jobs every 2 seconds
});

// Stop processing (graceful shutdown)
await queueManager.stopProcessing();
```

### Managing Jobs

```typescript
// Get job by ID
const job = await queueManager.getJob(jobId);

// List jobs with filters
const jobs = await queueManager.getJobs({
  status: JobStatus.FAILED,
  limit: 50,
  offset: 0,
});

// Retry a failed job
await queueManager.retryJob(jobId);

// Delete a job
await queueManager.deleteJob(jobId);

// Get queue statistics
const stats = await queueManager.getStats();
console.log(stats);
// {
//   pending: 5,
//   processing: 2,
//   completed: 100,
//   failed: 3,
//   retrying: 1,
//   scheduled: 10
// }
```

## Job Priorities

```typescript
import { JobPriority } from '@townkrier/queue';

JobPriority.LOW;       // 1  - Background tasks
JobPriority.NORMAL;    // 5  - Standard notifications
JobPriority.HIGH;      // 10 - Important notifications
JobPriority.CRITICAL;  // 20 - Urgent notifications (password resets, etc.)

// Higher priority jobs are processed first
await queueManager.enqueue(notification, recipient, {
  priority: JobPriority.CRITICAL,
});
```

## Retry Logic

Jobs automatically retry on failure with exponential backoff:

- **1st retry**: After `retryDelay` ms (e.g., 1000ms)
- **2nd retry**: After `retryDelay * 2` ms (e.g., 2000ms)
- **3rd retry**: After `retryDelay * 4` ms (e.g., 4000ms)
- **Nth retry**: After `retryDelay * 2^(N-1)` ms

Jobs are marked as failed after `maxRetries` attempts.

## BullMQ Features

### Worker-based Processing

BullMQ uses a worker-based architecture for efficient job processing:

```typescript
// Worker automatically starts when processing begins
queueManager.startProcessing();

// Jobs are processed by BullMQ workers
// Multiple workers can process jobs concurrently
```

### Redis Persistence

All jobs are persisted in Redis:
- Survives application restarts
- Distributed queue support
- Horizontal scaling capability

### Job Metadata

Store custom metadata with jobs:

```typescript
await queueManager.enqueue(notification, recipient, {
  metadata: {
    userId: '123',
    source: 'web-app',
    campaign: 'welcome-series',
  },
});
```

## Configuration

### InMemoryQueueAdapter Config

```typescript
interface QueueAdapterConfig {
  maxRetries?: number;      // Default: 3
  retryDelay?: number;      // Default: 1000ms
  timeout?: number;         // Default: 30000ms
  pollInterval?: number;    // Default: 1000ms
}
```

### BullMQQueueAdapter Config

```typescript
interface BullMQQueueAdapterConfig extends QueueAdapterConfig {
  redis?: {
    host?: string;          // Default: 'localhost'
    port?: number;          // Default: 6379
    password?: string;      // Optional
    db?: number;            // Default: 0
    maxRetriesPerRequest?: null;  // Required: null
  };
  queueName?: string;       // Default: 'townkrier-notifications'
}
```

## Redis Setup

### Using Docker

```bash
# Run Redis container
docker run -d -p 6379:6379 --name redis redis:alpine

# Or with persistence
docker run -d -p 6379:6379 --name redis \
  -v redis-data:/data \
  redis:alpine redis-server --appendonly yes

# Check Redis is running
docker exec redis redis-cli ping
# Should return: PONG
```

### Using Docker Compose

```yaml
version: '3.8'
services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes

volumes:
  redis-data:
```

### Environment Variables

```bash
# .env file
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-secure-password
```

## Job Statuses

- `PENDING`: Waiting to be processed
- `PROCESSING`: Currently being processed
- `COMPLETED`: Successfully completed
- `FAILED`: Failed after max retries
- `RETRYING`: Failed but will retry
- `SCHEDULED`: Scheduled for future processing

## Best Practices

### Production Deployment

1. **Use BullMQ adapter** for persistent queue storage
2. **Configure Redis** with persistence (AOF or RDB)
3. **Set appropriate retry limits** based on notification type
4. **Monitor queue stats** regularly
5. **Handle graceful shutdown** properly

```typescript
// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  await queueManager.stopProcessing();
  
  // Close BullMQ connections
  const adapter = queueManager.getAdapter() as BullMQQueueAdapter;
  await adapter.close();
  
  process.exit(0);
});
```

### Performance Tuning

- Adjust `pollInterval` based on your load
- Use job priorities to handle urgent notifications first
- Configure Redis memory limits appropriately
- Monitor Redis memory usage
- Consider Redis clustering for high availability

### Monitoring

Use the [@townkrier/dashboard](../dashboard) package for monitoring:

```typescript
import { DashboardServer } from '@townkrier/dashboard';

const dashboard = new DashboardServer({
  queueManager,
  storageManager,
  port: 3000,
  path: '/dashboard',
});

dashboard.start();
```

## Examples

See [examples/bullmq-dashboard-example.ts](../../examples/bullmq-dashboard-example.ts) for a complete working example.

## API Reference

### QueueManager

```typescript
class QueueManager {
  // Send immediately (like Laravel's sendNow)
  sendNow(notification, recipient): Promise<Map<Channel, any>>;
  
  // Queue for background (like Laravel's send)
  enqueue(notification, recipient, config?): Promise<QueueJob>;
  
  // Job management
  getJob(jobId): Promise<QueueJob | null>;
  getJobs(filters?): Promise<QueueJob[]>;
  retryJob(jobId): Promise<void>;
  deleteJob(jobId): Promise<void>;
  
  // Statistics
  getStats(): Promise<QueueStats>;
  
  // Processing control
  startProcessing(options?): void;
  stopProcessing(): Promise<void>;
  
  // Get underlying adapter
  getAdapter(): IQueueAdapter;
}
```

## Troubleshooting

### Jobs not processing

1. Ensure processing is started:
```typescript
queueManager.startProcessing();
```

2. For BullMQ, check Redis connection:
```bash
redis-cli ping
```

3. Check queue stats:
```typescript
const stats = await queueManager.getStats();
console.log(stats);
```

### BullMQ connection errors

- Verify Redis is running
- Check connection configuration
- Ensure `maxRetriesPerRequest: null` is set
- Check firewall rules

### Memory issues

- Monitor Redis memory usage
- Configure Redis eviction policy
- Clean up old completed jobs
- Adjust job retention settings

## License

MIT

