# @townkrier/dashboard

Hangfire-style dashboard for monitoring TownKrier notifications.

## Features

- 📊 **Real-time Statistics**: View notification delivery stats
- 📋 **Job Monitoring**: Track notification jobs and their status
- 🔍 **Search & Filter**: Find notifications by channel, status, recipient
- 🔄 **Retry Management**: Manually retry failed notifications
- 📈 **Analytics**: Charts and graphs for delivery rates
- 📝 **Logs Viewer**: View detailed logs with retry history
- 🔒 **Privacy-aware**: Content masking for sensitive data

## Installation

```bash
npm install @townkrier/dashboard
```

## Usage

### Basic Setup

```typescript
import { DashboardServer } from '@townkrier/dashboard';
import { QueueManager } from '@townkrier/queue';
import { StorageManager } from '@townkrier/storage';

const dashboard = new DashboardServer({
  queueManager,
  storageManager,
  port: 3000,
  path: '/dashboard',
});

dashboard.start();
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

## API Endpoints

- `GET /api/stats` - Get queue and notification statistics
- `GET /api/jobs` - List jobs with filters
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs/:id/retry` - Retry a failed job
- `DELETE /api/jobs/:id` - Delete a job
- `GET /api/logs` - Query notification logs
- `GET /api/logs/:id` - Get log details

## UI Features

The dashboard provides a web interface similar to Hangfire showing:

1. **Overview Page**
   - Total notifications sent
   - Success/failure rates
   - Jobs by status (pending, processing, completed, failed)
   - Real-time charts

2. **Jobs Page**
   - List of all jobs with status
   - Filter by status, priority, date
   - Sort and pagination
   - Retry and delete actions

3. **Logs Page**
   - Notification history
   - Delivery status and timing
   - Content preview (privacy-aware)
   - Retry history
   - Search and filters

4. **Job Details Page**
   - Complete job information
   - Notification content
   - Execution attempts
   - Error messages
   - Timeline view

## Configuration

```typescript
interface DashboardConfig {
  queueManager: QueueManager;
  storageManager: StorageManager;
  port?: number;
  path?: string;
  auth?: {
    enabled: boolean;
    username: string;
    password: string;
  };
  ui?: {
    title?: string;
    theme?: 'light' | 'dark';
  };
}
```

## Security

- Basic authentication support
- Content privacy masking
- Rate limiting (recommended in production)

## License

MIT
