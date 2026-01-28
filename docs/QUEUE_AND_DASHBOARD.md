# Queue System and Dashboard Usage

This guide covers the queue system with retry logic and monitoring dashboard, similar to Hangfire for .NET.

## Table of Contents

- [Overview](#overview)
- [Queue System](#queue-system)
- [Storage System](#storage-system)
- [Dashboard UI](#dashboard-ui)
- [Complete Example](#complete-example)
- [API Reference](#api-reference)

## Overview

TownKrier provides a complete background job processing system for notifications with:

- **Queue Management**: Background job processing like Laravel's queue system
- **Retry Logic**: Automatic retries with exponential backoff (Hangfire-like)
- **Job Scheduling**: Schedule notifications for future delivery
- **Notification Logs**: Complete history with privacy-aware content
- **Monitoring Dashboard**: Hangfire-style web UI for monitoring

## Queue System

### Installation

```bash
npm install townkrier-queue
```

### Basic Setup

```typescript
import { QueueManager, InMemoryQueueAdapter } from 'townkrier-queue';
import { NotificationManager } from 'townkrier-core';

// Create queue adapter
const queueAdapter = new InMemoryQueueAdapter({
  maxRetries: 3, // Maximum retry attempts
  retryDelay: 1000, // Initial delay in ms (exponential backoff)
  timeout: 30000, // Job timeout in ms
  pollInterval: 1000, // How often to check for jobs
});

// Create queue manager
const queueManager = new QueueManager(queueAdapter, notificationManager);

// Start background processing
queueManager.startProcessing({ pollInterval: 2000 });
```

### Sending Notifications

#### Immediate Send (like Laravel's `sendNow`)

```typescript
// Send immediately without queuing
const result = await queueManager.sendNow(notification, recipient);
```

#### Queue for Background Processing (like Laravel's `send`)

```typescript
// Add to queue for background processing
const job = await queueManager.enqueue(notification, recipient);

// With options
const job = await queueManager.enqueue(notification, recipient, {
  priority: JobPriority.HIGH,
  maxRetries: 5,
  metadata: { source: 'user-action' },
});
```

#### Schedule for Future Delivery

```typescript
// Schedule notification for specific time
const scheduledTime = new Date(Date.now() + 3600000); // 1 hour from now

const job = await queueManager.enqueue(notification, recipient, {
  scheduledFor: scheduledTime,
  priority: JobPriority.NORMAL,
});
```

### Job Management

```typescript
// Get job by ID
const job = await queueManager.getJob(jobId);

// Get jobs with filters
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

### Retry Logic

The queue adapter automatically handles retries with exponential backoff:

1. **First retry**: After `retryDelay` ms (e.g., 1000ms)
2. **Second retry**: After `retryDelay * 2` ms (e.g., 2000ms)
3. **Third retry**: After `retryDelay * 4` ms (e.g., 4000ms)
4. **Nth retry**: After `retryDelay * 2^(N-1)` ms

Jobs are marked as failed after `maxRetries` attempts.

### Job Priorities

```typescript
import { JobPriority } from 'townkrier-queue';

// Available priorities (higher number = higher priority)
JobPriority.LOW; // 1
JobPriority.NORMAL; // 5
JobPriority.HIGH; // 10
JobPriority.CRITICAL; // 20

// Higher priority jobs are processed first
await queueManager.enqueue(notification, recipient, {
  priority: JobPriority.CRITICAL,
});
```

### Stopping Processing

```typescript
// Stop processing jobs
queueManager.stopProcessing();
```

## Storage System

### Installation

```bash
npm install townkrier-storage
```

### Basic Setup

```typescript
import { StorageManager, InMemoryStorageAdapter } from 'townkrier-storage';

// Create storage adapter
const storageAdapter = new InMemoryStorageAdapter({
  maskSensitiveContent: true,
  contentPrivacyLevel: ContentPrivacy.MASKED,
  retentionDays: 30,
  autoCleanup: false,
});

// Create storage manager
const storageManager = new StorageManager(storageAdapter);
```

### Logging Notifications

```typescript
// Log a notification
await storageManager.logNotification({
  notificationId: 'unique-id',
  channel: NotificationChannel.EMAIL,
  recipient: 'user@example.com',
  status: NotificationLogStatus.SENT,
  subject: 'Welcome Email',
  content: 'Email content here',
  contentPrivacy: ContentPrivacy.MASKED,
  attempts: 1,
  retryLogs: [],
  sentAt: new Date(),
});
```

### Querying Logs

```typescript
// Query logs with filters
const result = await storageManager.queryLogs({
  channel: NotificationChannel.EMAIL,
  status: NotificationLogStatus.SENT,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  limit: 50,
  offset: 0,
  sortBy: 'sentAt',
  sortOrder: 'desc',
});

console.log(`Total: ${result.total}, Showing: ${result.logs.length}`);
result.logs.forEach((log) => {
  console.log(`${log.channel}: ${log.recipient} [${log.status}]`);
});
```

### Statistics

```typescript
// Get statistics
const stats = await storageManager.getStats({
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  channel: NotificationChannel.EMAIL,
});

console.log(stats);
// {
//   total: 1000,
//   sent: 950,
//   delivered: 900,
//   failed: 50,
//   retrying: 0,
//   byChannel: { email: 800, sms: 200 },
//   byStatus: { sent: 950, failed: 50 }
// }
```

### Cleanup

```typescript
// Delete logs older than 30 days
const olderThan = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
const deletedCount = await storageManager.cleanup(olderThan);
console.log(`Deleted ${deletedCount} old logs`);
```

## Dashboard UI

### Installation

```bash
npm install townkrier-dashboard
```

### Basic Setup

```typescript
import { DashboardServer } from 'townkrier-dashboard';

// Create dashboard server
const dashboard = new DashboardServer({
  queueManager,
  storageManager,
  port: 3000,
  path: '/dashboard',
});

// Start the server
dashboard.start();
// Dashboard available at: http://localhost:3000/dashboard
```

### With Authentication

```typescript
const dashboard = new DashboardServer({
  queueManager,
  storageManager,
  port: 3000,
  path: '/dashboard',
  auth: {
    enabled: true,
    username: 'admin',
    password: 'secret',
  },
});

dashboard.start();
```

### Integration with Express

```typescript
import express from 'express';
import { createDashboardRouter } from 'townkrier-dashboard';

const app = express();

// Add dashboard as a route
app.use(
  '/notifications',
  createDashboardRouter({
    queueManager,
    storageManager,
  }),
);

app.listen(3000);
```

### API Endpoints

The dashboard provides REST API endpoints:

#### Statistics

```
GET /api/stats
```

#### Jobs

```
GET /api/jobs?status=failed&limit=50&offset=0
GET /api/jobs/:id
POST /api/jobs/:id/retry
DELETE /api/jobs/:id
```

#### Logs

```
GET /api/logs?channel=email&status=sent&limit=50&offset=0
GET /api/logs/:id
```

#### Health Check

```
GET /api/health
```

### Dashboard Features

The web UI provides:

1. **Overview Dashboard**
   - Real-time job statistics
   - Pending, processing, completed, and failed counts
   - Auto-refreshes every 5 seconds

2. **Jobs List**
   - View all jobs with status
   - Filter by status
   - Retry failed jobs
   - Delete jobs

3. **Logs List**
   - View notification history
   - Filter by channel, status, date
   - See delivery times

## Complete Example

```typescript
import { NotificationManager, Notification, NotificationChannel } from 'townkrier-core';
import { QueueManager, InMemoryQueueAdapter, JobPriority } from 'townkrier-queue';
import { StorageManager, InMemoryStorageAdapter } from 'townkrier-storage';
import { DashboardServer } from 'townkrier-dashboard';
import { createResendChannel } from 'townkrier-resend';

// 1. Setup Notification Manager
const notificationManager = new NotificationManager({
  defaultChannel: 'email-resend',
  channels: [
    {
      name: 'email-resend',
      enabled: true,
      config: {
        apiKey: process.env.RESEND_API_KEY,
        from: 'notifications@example.com',
      },
    },
  ],
});

notificationManager.registerFactory('email-resend', createResendChannel);

// 2. Setup Queue
const queueAdapter = new InMemoryQueueAdapter({
  maxRetries: 3,
  retryDelay: 1000,
});

const queueManager = new QueueManager(queueAdapter, notificationManager);

// 3. Setup Storage
const storageManager = new StorageManager(new InMemoryStorageAdapter());

// 4. Setup Dashboard
const dashboard = new DashboardServer({
  queueManager,
  storageManager,
  port: 3000,
  path: '/dashboard',
});

// 5. Start Everything
queueManager.startProcessing();
dashboard.start();

// 6. Create Notification
class WelcomeEmail extends Notification {
  via() {
    return [NotificationChannel.EMAIL];
  }
  toEmail() {
    return {
      subject: 'Welcome!',
      html: '<h1>Welcome!</h1>',
      text: 'Welcome!',
      message: 'Welcome!',
    };
  }
}

// 7. Send Notifications
const notification = new WelcomeEmail();
const recipient = {
  [NotificationChannel.EMAIL]: { email: 'user@example.com' },
};

// Send immediately
await queueManager.sendNow(notification, recipient);

// Queue for background
await queueManager.enqueue(notification, recipient);

// Schedule for later
await queueManager.enqueue(notification, recipient, {
  scheduledFor: new Date(Date.now() + 60000), // 1 minute
  priority: JobPriority.HIGH,
});

// Visit http://localhost:3000/dashboard to monitor!
```

## API Reference

### QueueManager

```typescript
class QueueManager {
  constructor(adapter: IQueueAdapter, notificationManager?: NotificationManager);

  // Send immediately
  sendNow(
    notification: Notification,
    recipient: NotificationRecipient,
  ): Promise<Map<NotificationChannel, unknown>>;

  // Queue for background
  enqueue(
    notification: Notification,
    recipient: NotificationRecipient,
    config?: QueueJobConfig,
  ): Promise<QueueJob>;

  // Job management
  getJob(jobId: string): Promise<QueueJob | null>;
  getJobs(filters?: JobFilters): Promise<QueueJob[]>;
  retryJob(jobId: string): Promise<void>;
  deleteJob(jobId: string): Promise<void>;

  // Statistics
  getStats(): Promise<QueueStats>;

  // Processing control
  startProcessing(options?: { pollInterval?: number }): void;
  stopProcessing(): void;
}
```

### StorageManager

```typescript
class StorageManager {
  constructor(adapter: IStorageAdapter);

  // Logging
  logNotification(
    log: Omit<NotificationLog, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<NotificationLog>;
  updateLog(id: string, updates: Partial<NotificationLog>): Promise<NotificationLog>;

  // Querying
  getLog(id: string): Promise<NotificationLog | null>;
  queryLogs(filters: LogFilters): Promise<{ logs: NotificationLog[]; total: number }>;

  // Statistics
  getStats(filters?: StatsFilters): Promise<StorageStats>;

  // Cleanup
  cleanup(olderThan: Date): Promise<number>;
}
```

### DashboardServer

```typescript
class DashboardServer {
  constructor(config: DashboardServerConfig);

  // Server control
  start(): void;
  stop(): void;

  // Access underlying Express app
  getApp(): Express;
}
```

## Best Practices

1. **Use Queue for High Volume**: Always use queue for sending many notifications
2. **Set Appropriate Priorities**: Use CRITICAL sparingly, NORMAL for most cases
3. **Configure Retry Logic**: Adjust retries and delays based on your needs
4. **Monitor the Dashboard**: Check failed jobs regularly
5. **Clean Old Logs**: Schedule cleanup to manage storage
6. **Mask Sensitive Content**: Enable content privacy for PII
7. **Use Scheduled Jobs**: For time-sensitive notifications

## Troubleshooting

### Jobs Stuck in Processing

```typescript
// Check queue statistics
const stats = await queueManager.getStats();
console.log(stats);

// Restart processing if needed
queueManager.stopProcessing();
queueManager.startProcessing();
```

### Failed Jobs Not Retrying

Check your retry configuration:

```typescript
const queueAdapter = new InMemoryQueueAdapter({
  maxRetries: 3, // Must be > 0
  retryDelay: 1000, // Must be > 0
});
```

### Dashboard Not Accessible

Ensure the server is running:

```typescript
dashboard.start();
console.log('Dashboard: http://localhost:3000/dashboard');
```

## Next Steps

- Explore [examples/queue-and-dashboard-example.ts](../examples/queue-and-dashboard-example.ts)
- Check out package READMEs for more details
- Build custom adapters for Redis or databases
