# Dashboard Integration Guide

## Overview

The TownKrier Dashboard now supports two modes:

1. **Integrated Mode (Default)** - Dashboard runs on the same server instance and port as your application
2. **Standalone Mode (Backward Compatible)** - Dashboard runs on a separate port

## Why Integrated Mode?

- ✅ **Single Port**: No need to manage multiple ports
- ✅ **Simplified Deployment**: One process to deploy and monitor
- ✅ **Resource Efficient**: Shared server resources
- ✅ **Easier Development**: One server to start during development
- ✅ **Better Integration**: Natural part of your application

## Usage

### 1. Integrated Mode (Recommended)

Use `setupDashboard()` to integrate the dashboard into your existing Express or NestJS application:

#### Express Example

```typescript
import express from 'express';
import { setupDashboard } from '@townkrier/dashboard';

const app = express();

// Your application routes
app.get('/', (req, res) => {
  res.send('My Application');
});

// Setup dashboard on same server
setupDashboard(app, {
  queueManager,
  storageManager,
  path: '/dashboard', // Optional, defaults to '/townkrier/dashboard'
  auth: {
    // Optional authentication
    enabled: true,
    username: 'admin',
    password: 'secret',
  },
});

app.listen(3000);
console.log('App: http://localhost:3000');
console.log('Dashboard: http://localhost:3000/dashboard');
```

#### NestJS Example

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { setupDashboard } from '@townkrier/dashboard';

@Injectable()
export class DashboardService implements OnModuleInit {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly queueManager: QueueManager,
    private readonly storageManager: StorageManager,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    // Get the underlying Express app from NestJS
    const app = this.httpAdapterHost.httpAdapter.getInstance();

    setupDashboard(app, {
      queueManager: this.queueManager,
      storageManager: this.storageManager,
      path: this.configService.get('DASHBOARD_PATH') || '/dashboard',
    });

    const port = this.configService.get('PORT') || 3000;
    console.log(`Dashboard: http://localhost:${port}/dashboard`);
  }
}
```

### 2. Standalone Mode (Backward Compatible)

Use `DashboardServer` class to run the dashboard on a separate port:

```typescript
import { DashboardServer } from '@townkrier/dashboard';

const dashboard = new DashboardServer({
  queueManager,
  storageManager,
  port: 4000, // Dashboard runs on its own port
  path: '/dashboard',
});

dashboard.start();
console.log('Dashboard: http://localhost:4000/dashboard');
```

#### NestJS Standalone Mode

```typescript
@Injectable()
export class DashboardService implements OnModuleInit {
  private dashboardServer?: DashboardServer;

  constructor(
    private readonly configService: ConfigService,
    private readonly queueManager: QueueManager,
    private readonly storageManager: StorageManager,
  ) {}

  async onModuleInit() {
    // Check if standalone mode is enabled
    const standalone = this.configService.get('DASHBOARD_STANDALONE') === 'true';

    if (standalone) {
      this.dashboardServer = new DashboardServer({
        queueManager: this.queueManager,
        storageManager: this.storageManager,
        port: 4000,
        path: '/dashboard',
      });

      this.dashboardServer.start();
      console.log('Dashboard (standalone): http://localhost:4000/dashboard');
    }
  }
}
```

## Migration Guide

If you're currently using the old standalone approach and want to migrate to integrated mode:

### Before (Standalone)

```typescript
const dashboard = new DashboardServer({
  queueManager,
  storageManager,
  port: 4000,
  path: '/dashboard',
});

dashboard.start();
```

### After (Integrated)

```typescript
import { setupDashboard } from '@townkrier/dashboard';

// In your Express app
setupDashboard(app, {
  queueManager,
  storageManager,
  path: '/dashboard',
});

// Or in NestJS
const app = this.httpAdapterHost.httpAdapter.getInstance();
setupDashboard(app, {
  queueManager,
  storageManager,
  path: '/dashboard',
});
```

## Configuration Options

### `setupDashboard(app, config)`

- `app`: Express application instance
- `config.queueManager`: QueueManager instance
- `config.storageManager`: StorageManager instance
- `config.path`: Base path for dashboard (default: `/townkrier/dashboard`)
- `config.auth`: Optional authentication settings
  - `enabled`: Enable basic auth
  - `username`: Auth username
  - `password`: Auth password

### `DashboardServer(config)`

All options from `setupDashboard` plus:

- `config.port`: Port number for standalone server (default: 3000)

## Environment Variables (NestJS Example)

```bash
# Integrated mode (default)
PORT=3000
DASHBOARD_PATH=/dashboard

# Standalone mode
DASHBOARD_STANDALONE=true
DASHBOARD_PORT=4000
DASHBOARD_PATH=/dashboard

# Authentication (optional)
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=secret
```

## API Routes

Both modes expose the same API endpoints:

- `GET {path}/api/stats` - Overall statistics
- `GET {path}/api/jobs` - List jobs
- `GET {path}/api/jobs/:id` - Get job details
- `POST {path}/api/jobs/:id/retry` - Retry job
- `DELETE {path}/api/jobs/:id` - Delete job
- `GET {path}/api/logs` - Query logs
- `GET {path}/api/logs/:id` - Get log details
- `GET {path}/api/health` - Health check

## UI Pages

- `GET {path}` - Overview dashboard
- `GET {path}/jobs` - Jobs list
- `GET {path}/jobs/:id` - Job details
- `GET {path}/logs` - Logs list
- `GET {path}/logs/:id` - Log details
- `GET {path}/analysis` - Delivery analysis

## Best Practices

1. **Use Integrated Mode** for most applications - simpler and more efficient
2. **Use Standalone Mode** when:
   - You need strict separation of concerns
   - Different deployment strategies for dashboard vs app
   - Dashboard needs different scaling characteristics
3. **Always enable authentication** in production
4. **Use environment variables** for configuration
5. **Mount dashboard on a non-conflicting path** (avoid `/api`, `/`, etc.)

## Troubleshooting

### Views not found

Make sure to build the dashboard package:

```bash
cd packages/dashboard
pnpm build
```

The build process copies EJS templates to the `dist/views` folder.

### Dashboard returns JSON instead of HTML

Check that you're accessing UI routes, not API routes:

- ✅ `http://localhost:3000/dashboard` (UI)
- ❌ `http://localhost:3000/dashboard/api/stats` (API - returns JSON)

### Express app not available in NestJS

Make sure to inject `HttpAdapterHost`:

```typescript
constructor(private readonly httpAdapterHost: HttpAdapterHost) {}
```

Then get the app:

```typescript
const app = this.httpAdapterHost.httpAdapter.getInstance();
```
