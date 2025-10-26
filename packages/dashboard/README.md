# @townkrier/dashboard

Hangfire-style dashboard for monitoring TownKrier notifications with EJS templates.

## Features

- 📊 **Real-time Statistics**: Auto-refreshing notification delivery stats
- 📋 **Job Monitoring**: Track notification jobs and their status with BullMQ/Redis support
- 🔍 **Search & Filter**: Find notifications by channel, status, recipient, date
- 🔄 **Retry Management**: Manually retry failed notifications with one click
- 📈 **Analytics**: Delivery analysis with success rates and channel breakdown
- 📝 **Logs Viewer**: View detailed logs with retry history
- 🔒 **Privacy-aware**: Content masking for sensitive data (PII protection)
- 🎨 **Modern UI**: Clean, responsive EJS-based interface
- 👁️ **Content Preview**: Toggle between preview and raw content views
- ⏰ **Scheduled Jobs**: View and manage scheduled notifications

## Installation

```bash
npm install @townkrier/dashboard @townkrier/queue @townkrier/storage
# For BullMQ support
npm install bullmq ioredis
```

## Usage

### Basic Setup with BullMQ

```typescript
import { DashboardServer } from '@townkrier/dashboard';
import { QueueManager, BullMQQueueAdapter } from '@townkrier/queue';
import { StorageManager, InMemoryStorageAdapter } from '@townkrier/storage';

// Setup BullMQ queue adapter (Redis-backed)
const queueAdapter = new BullMQQueueAdapter({
  redis: {
    host: 'localhost',
    port: 6379,
    maxRetriesPerRequest: null,
  },
  queueName: 'townkrier-notifications',
  maxRetries: 3,
  retryDelay: 1000,
});

const queueManager = new QueueManager(queueAdapter, notificationManager);
const storageManager = new StorageManager(new InMemoryStorageAdapter());

// Create and start dashboard
const dashboard = new DashboardServer({
  queueManager,
  storageManager,
  port: 3000,
  path: '/dashboard',
});

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
    password: 'your-secure-password',
  },
});
```

### With Express App

```typescript
import express from 'express';
import { createDashboardRouter } from '@townkrier/dashboard';

const app = express();

app.use(
  '/dashboard',
  createDashboardRouter({
    queueManager,
    storageManager,
  }),
);

app.listen(3000);
```

## Dashboard Pages

### 1. Overview (Home)
- **URL**: `/dashboard`
- **Features**:
  - Real-time queue statistics (auto-refresh every 5 seconds)
  - Recent jobs list with status
  - Recent notification logs
  - Quick actions (retry, delete)

### 2. Jobs List
- **URL**: `/dashboard/jobs`
- **Features**:
  - Filter by status (pending, processing, completed, failed, scheduled)
  - Pagination (10, 25, 50, 100 per page)
  - Sort by creation date
  - Bulk actions
  - View job details

### 3. Job Details
- **URL**: `/dashboard/jobs/:id`
- **Features**:
  - Complete job information
  - Execution logs with timestamps
  - Retry history
  - Error messages
  - Notification payload
  - Metadata display

### 4. Notification Logs
- **URL**: `/dashboard/logs`
- **Features**:
  - Filter by channel (email, sms, push, in-app)
  - Filter by status (sent, delivered, failed, pending)
  - Pagination
  - Search by recipient
  - View log details

### 5. Log Details
- **URL**: `/dashboard/logs/:id`
- **Features**:
  - **Preview Tab**: Formatted content view
  - **Raw Tab**: Raw content JSON
  - Privacy-protected content display
  - Retry logs
  - Delivery timestamps
  - Channel information

### 6. Delivery Analysis
- **URL**: `/dashboard/analysis`
- **Features**:
  - Total notifications sent
  - Success rate calculation
  - Breakdown by channel
  - Breakdown by status
  - Queue performance metrics
  - Auto-refresh every 10 seconds

## API Endpoints

### Statistics
```
GET /api/stats
Response: {
  queue: { pending, processing, completed, failed, scheduled },
  notifications: { total, sent, failed, byChannel, byStatus },
  timestamp: Date
}
```

### Jobs
```
GET /api/jobs?status=failed&limit=50&offset=0
GET /api/jobs/:id
POST /api/jobs/:id/retry
DELETE /api/jobs/:id
```

### Logs
```
GET /api/logs?channel=email&status=sent&limit=50&offset=0
GET /api/logs/:id
```

### Health Check
```
GET /api/health
```

## Configuration

```typescript
interface DashboardServerConfig {
  queueManager: QueueManager;
  storageManager: StorageManager;
  port?: number;           // Default: 3000
  path?: string;           // Default: '/dashboard'
  auth?: {
    enabled: boolean;
    username: string;
    password: string;      // Use strong passwords in production
  };
}
```

## BullMQ Integration

The dashboard fully supports BullMQ with Redis for persistent queue storage:

```typescript
import { BullMQQueueAdapter } from '@townkrier/queue';

const adapter = new BullMQQueueAdapter({
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD, // Optional
    db: 0,
    maxRetriesPerRequest: null,
  },
  queueName: 'townkrier-notifications',
  maxRetries: 3,
  retryDelay: 1000,
});
```

### Redis Setup with Docker
```bash
# Run Redis container
docker run -d -p 6379:6379 --name redis redis:alpine

# Or with persistence
docker run -d -p 6379:6379 --name redis \
  -v redis-data:/data \
  redis:alpine redis-server --appendonly yes
```

## Security

### Authentication
Basic authentication is supported for production use:

```typescript
auth: {
  enabled: true,
  username: process.env.DASHBOARD_USER,
  password: process.env.DASHBOARD_PASSWORD,
}
```

### Content Privacy
The dashboard respects content privacy settings:
- `FULL`: All content visible
- `MASKED`: Sensitive data masked
- `HIDDEN`: No content displayed

### Recommendations
- Always enable authentication in production
- Use HTTPS in production
- Configure firewall rules to restrict dashboard access
- Use strong passwords
- Consider IP whitelisting
- Implement rate limiting

## Styling

The dashboard features a modern, responsive design with:
- Gradient header (purple/blue)
- Status badges with color coding
- Hover effects and transitions
- Mobile-responsive layout
- Auto-refresh for real-time data
- Empty state handling

## Complete Example

See [examples/bullmq-dashboard-example.ts](../../examples/bullmq-dashboard-example.ts) for a complete working example with:
- BullMQ setup with Redis
- Notification creation
- Queue management
- Dashboard integration
- Graceful shutdown

## Troubleshooting

### Dashboard not loading
- Check that the server is running
- Verify the port is not in use
- Check console for errors

### Jobs not processing
- Ensure queue processing is started: `queueManager.startProcessing()`
- For BullMQ: Verify Redis connection
- Check worker is running

### Stats not updating
- Auto-refresh is enabled by default (5s interval)
- Check browser console for fetch errors
- Verify API endpoints are accessible

### Redis connection errors (BullMQ)
```bash
# Check Redis is running
redis-cli ping
# Should return: PONG

# View queue contents
redis-cli
> KEYS townkrier-notifications:*
```

## License

MIT

