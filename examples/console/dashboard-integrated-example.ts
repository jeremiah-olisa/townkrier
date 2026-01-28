/**
 * Dashboard Integration Example
 *
 * This example shows how to integrate the TownKrier Dashboard
 * into your Express application on the same port (integrated mode).
 */

import express from 'express';
import { setupDashboard } from 'townkrier-dashboard';
import { NotificationManager } from 'townkrier-core';
import { QueueManager, InMemoryQueueAdapter } from 'townkrier-queue';
import { StorageManager, InMemoryStorageAdapter } from 'townkrier-storage';

// Initialize notification system
const notificationManager = new NotificationManager({
  channels: [
    {
      name: 'email',
      adapters: [
        // TODO: SETUP Resend adapter with API key
      ],
    },
  ],
});

// Initialize queue and storage
const queueManager = new QueueManager(new InMemoryQueueAdapter(), notificationManager);

const storageManager = new StorageManager(new InMemoryStorageAdapter());

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Application routes
app.get('/', (req, res) => {
  res.json({
    message: 'TownKrier Notification System',
    dashboard: 'http://localhost:3000/dashboard',
    api: {
      health: 'http://localhost:3000/dashboard/api/health',
      stats: 'http://localhost:3000/dashboard/api/stats',
    },
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Setup TownKrier Dashboard (integrated mode)
console.log('Setting up TownKrier Dashboard in integrated mode...');

setupDashboard(app, {
  queueManager,
  storageManager,
  path: '/dashboard',
  // Optional: Enable authentication
  // auth: {
  //   enabled: true,
  //   username: 'admin',
  //   password: 'secret',
  // },
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('='.repeat(80));
  console.log('🚀 TownKrier Dashboard Integration Example');
  console.log('='.repeat(80));
  console.log(`📡 Application:  http://localhost:${PORT}`);
  console.log(`📊 Dashboard:    http://localhost:${PORT}/dashboard`);
  console.log(`🏥 Health:       http://localhost:${PORT}/health`);
  console.log('='.repeat(80));
  console.log('Dashboard Features:');
  console.log('  ✅ Same port as your application');
  console.log('  ✅ Integrated into Express app');
  console.log('  ✅ No separate process to manage');
  console.log('='.repeat(80));
  console.log('\n💡 Tip: Visit the dashboard to monitor notifications!');
  console.log('');
});
