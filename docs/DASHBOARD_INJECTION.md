# Dashboard Injection Guide

The TownKrier dashboard can be injected into your existing Express application instance using the `getApp()` method. This allows you to mount the dashboard alongside your application routes.

## Method 1: Inject into Existing Express App

```typescript
import express from 'express';
import { DashboardServer } from '@townkrier/dashboard';
import { QueueManager, InMemoryQueueAdapter } from '@townkrier/queue';
import { StorageManager, InMemoryStorageAdapter } from '@townkrier/storage';
import { NotificationManager } from '@townkrier/core';

// Create your main Express app
const app = express();

// Setup your application middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Your application routes
app.get('/', (req, res) => {
  res.send('My Application');
});

app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});

// Setup notification system components
const notificationManager = new NotificationManager(/* config */);
const queueManager = new QueueManager(new InMemoryQueueAdapter({}), notificationManager);
const storageManager = new StorageManager(new InMemoryStorageAdapter({}));

// Create dashboard server instance (don't call start())
const dashboardServer = new DashboardServer({
  queueManager,
  storageManager,
  path: '/dashboard', // Dashboard will be available at /dashboard
  auth: {
    enabled: true,
    username: 'admin',
    password: 'secret',
  },
});

// Inject dashboard into your app
app.use('/dashboard', dashboardServer.getApp());

// Start your application server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Dashboard available at http://localhost:${PORT}/dashboard`);
});
```

## Method 2: Standalone Dashboard Server

If you prefer to run the dashboard as a separate server:

```typescript
import { DashboardServer } from '@townkrier/dashboard';
import { QueueManager, InMemoryQueueAdapter } from '@townkrier/queue';
import { StorageManager, InMemoryStorageAdapter } from '@townkrier/storage';
import { NotificationManager } from '@townkrier/core';

// Setup notification system components
const notificationManager = new NotificationManager(/* config */);
const queueManager = new QueueManager(new InMemoryQueueAdapter({}), notificationManager);
const storageManager = new StorageManager(new InMemoryStorageAdapter({}));

// Create and start dashboard server
const dashboardServer = new DashboardServer({
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

// Start the standalone dashboard
dashboardServer.start();
// Dashboard will be available at http://localhost:3000/dashboard
```

## Method 3: Custom Mount Path

You can mount the dashboard at any path in your application:

```typescript
import express from 'express';
import { DashboardServer } from '@townkrier/dashboard';

const app = express();

// Create dashboard with custom path
const dashboardServer = new DashboardServer({
  queueManager,
  storageManager,
  path: '/', // Internal dashboard routes will use this
});

// Mount at custom path in your app
app.use('/admin/notifications', dashboardServer.getApp());

// Dashboard will be available at /admin/notifications
```

## Method 4: Multiple Dashboards

You can even mount multiple dashboard instances if needed:

```typescript
import express from 'express';
import { DashboardServer } from '@townkrier/dashboard';

const app = express();

// Production notifications dashboard
const prodDashboard = new DashboardServer({
  queueManager: prodQueueManager,
  storageManager: prodStorageManager,
  path: '/dashboard',
});

// Staging notifications dashboard
const stagingDashboard = new DashboardServer({
  queueManager: stagingQueueManager,
  storageManager: stagingStorageManager,
  path: '/dashboard',
});

app.use('/production/dashboard', prodDashboard.getApp());
app.use('/staging/dashboard', stagingDashboard.getApp());
```

## Configuration Options

### DashboardServerConfig

```typescript
interface DashboardServerConfig {
  // Required: Queue manager instance
  queueManager: QueueManager;

  // Required: Storage manager instance
  storageManager: StorageManager;

  // Optional: Port for standalone server (not used when injecting)
  port?: number;

  // Optional: Base path for dashboard routes (default: '/dashboard')
  path?: string;

  // Optional: Basic authentication
  auth?: {
    enabled: boolean;
    username: string;
    password: string;
  };
}
```

## Authentication

When authentication is enabled, the dashboard requires HTTP Basic Authentication:

```bash
# Access dashboard with credentials
curl -u admin:secret http://localhost:3000/dashboard
```

Or in the browser, you'll be prompted for username and password.

## API Endpoints

When the dashboard is mounted, these API endpoints become available:

- `GET {basePath}/` - Dashboard home page
- `GET {basePath}/jobs` - Jobs list page
- `GET {basePath}/jobs/:id` - Job details page
- `GET {basePath}/logs` - Notification logs page
- `GET {basePath}/logs/:id` - Notification details page
- `GET {basePath}/analysis` - Delivery analysis page
- `GET {basePath}/api/stats` - Statistics API
- `GET {basePath}/api/jobs` - Jobs API
- `GET {basePath}/api/logs` - Logs API

## Complete Example

See `examples/complete-example.ts` and `examples/queue-and-dashboard-example.ts` for complete working examples.

## Notes

- When using `getApp()`, do NOT call `dashboardServer.start()` as this would create a separate HTTP server
- The dashboard is an Express application, so all Express middleware patterns work
- You can add your own middleware before the dashboard: `app.use(authMiddleware); app.use('/dashboard', dashboardServer.getApp());`
- The dashboard uses EJS templates for rendering UI
- All dashboard routes respect the `path` configuration option
