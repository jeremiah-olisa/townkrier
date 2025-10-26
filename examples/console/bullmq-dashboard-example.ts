import {
  NotificationManager,
  Notification,
  NotificationChannel,
  NotificationPriority,
  NotificationRecipient,
} from '@townkrier/core';
import { QueueManager, BullMQQueueAdapter, JobPriority } from '@townkrier/queue';
import {
  StorageManager,
  InMemoryStorageAdapter,
  NotificationLogStatus,
  ContentPrivacy,
} from '@townkrier/storage';
import { DashboardServer } from '@townkrier/dashboard';
import { createResendChannel } from '@townkrier/resend';

/**
 * Example demonstrating BullMQ queue adapter with Redis and EJS dashboard
 *
 * Prerequisites:
 * 1. Redis server running on localhost:6379 (or configure custom connection)
 * 2. Environment variables set (RESEND_API_KEY for email)
 *
 * To run Redis with Docker:
 * docker run -d -p 6379:6379 redis:alpine
 */

// ============================================================================
// 1. Setup Notification Manager
// ============================================================================

const notificationManager = new NotificationManager({
  defaultChannel: 'email-resend',
  enableFallback: true,
  channels: [
    {
      name: 'email-resend',
      enabled: true,
      priority: 10,
      config: {
        apiKey: process.env.RESEND_API_KEY || 'test-key',
        from: 'notifications@example.com',
        fromName: 'TownKrier Example',
      },
    },
  ],
});

// Register channel factories
notificationManager.registerFactory('email-resend', createResendChannel);

// ============================================================================
// 2. Setup Queue Manager with BullMQ (Redis-backed)
// ============================================================================

const bullmqAdapter = new BullMQQueueAdapter({
  maxRetries: 3, // Maximum retry attempts
  retryDelay: 1000, // Initial retry delay in ms (exponential backoff)
  timeout: 30000, // Job timeout
  pollInterval: 1000, // How often to check for new jobs
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    // password: process.env.REDIS_PASSWORD, // Uncomment if Redis has password
    // db: 0, // Redis database number
    maxRetriesPerRequest: null, // Required for BullMQ
  },
  queueName: 'townkrier-notifications', // Queue name in Redis
});

const queueManager = new QueueManager(bullmqAdapter, notificationManager);

// ============================================================================
// 3. Setup Storage Manager for Logs
// ============================================================================

const storageAdapter = new InMemoryStorageAdapter({
  maskSensitiveContent: true,
  contentPrivacyLevel: ContentPrivacy.MASKED,
  retentionDays: 30,
  autoCleanup: false,
});

const storageManager = new StorageManager(storageAdapter);

// ============================================================================
// 4. Setup Dashboard (EJS-based UI with Preview/Raw tabs)
// ============================================================================

const dashboardServer = new DashboardServer({
  queueManager,
  storageManager,
  port: 3000,
  path: '/dashboard',
  // Optional: Basic authentication
  // auth: {
  //   enabled: true,
  //   username: 'admin',
  //   password: 'secret',
  // },
});

// ============================================================================
// 5. Create Sample Notifications
// ============================================================================

class WelcomeEmailNotification extends Notification {
  constructor(private userName: string) {
    super();
    this.priority = NotificationPriority.HIGH;
  }

  via(): NotificationChannel[] {
    return [NotificationChannel.EMAIL];
  }

  toEmail() {
    return {
      subject: `Welcome to TownKrier, ${this.userName}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #667eea;">Welcome ${this.userName}!</h1>
          <p>Thank you for joining TownKrier notification system.</p>
          <p>This is a demonstration of BullMQ queue adapter with Redis storage.</p>
          <ul>
            <li>Persistent queue with Redis</li>
            <li>Automatic retries with exponential backoff</li>
            <li>EJS-based dashboard with preview/raw tabs</li>
            <li>Privacy-aware content masking</li>
          </ul>
          <p>Best regards,<br>TownKrier Team</p>
        </div>
      `,
      text: `Welcome ${this.userName}! Thank you for joining TownKrier notification system.`,
      message: `Welcome ${this.userName}!`,
    };
  }
}

class PasswordResetNotification extends Notification {
  constructor(private resetLink: string) {
    super();
    this.priority = NotificationPriority.URGENT;
  }

  via(): NotificationChannel[] {
    return [NotificationChannel.EMAIL];
  }

  toEmail() {
    return {
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Click the button below to reset your password:</p>
          <a href="${this.resetLink}" style="display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px;">Reset Password</a>
          <p style="color: #7f8c8d; margin-top: 20px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
      text: `Reset your password: ${this.resetLink}`,
      message: 'Password reset requested',
    };
  }
}

// ============================================================================
// 6. Demonstrate Usage
// ============================================================================

async function demonstrateBullMQQueue() {
  console.log('🚀 Starting TownKrier with BullMQ Queue Demo');
  console.log('================================================\n');

  // Start the queue processing
  console.log('📋 Starting BullMQ worker...');
  queueManager.startProcessing({ pollInterval: 2000 });

  // Start the dashboard server
  console.log('🖥️  Starting dashboard server...');
  dashboardServer.start();
  console.log(`📊 Dashboard available at: http://localhost:3000/dashboard`);
  console.log('   - Overview: http://localhost:3000/dashboard');
  console.log('   - Jobs: http://localhost:3000/dashboard/jobs');
  console.log('   - Logs: http://localhost:3000/dashboard/logs');
  console.log('   - Analysis: http://localhost:3000/dashboard/analysis\n');

  // ============================================================================
  // Example 1: Send notification immediately (like Laravel's sendNow)
  // ============================================================================
  console.log('Example 1: Sending notification immediately (sendNow)');
  console.log('-------------------------------------------------------');

  try {
    const notification1 = new WelcomeEmailNotification('John Doe');
    const recipient1 = {
      [NotificationChannel.EMAIL]: { email: 'john@example.com', name: 'John Doe' },
    };

    // Send immediately - not queued
    await queueManager.sendNow(notification1, recipient1);
    console.log('✅ Sent immediately');

    // Log to storage
    await storageManager.logNotification({
      notificationId: notification1.reference || 'notif-1',
      channel: NotificationChannel.EMAIL,
      recipient: 'john@example.com',
      status: NotificationLogStatus.SENT,
      subject: 'Welcome to TownKrier, John Doe!',
      content: 'Welcome email content (masked for privacy)',
      contentPrivacy: ContentPrivacy.MASKED,
      attempts: 1,
      retryLogs: [],
      sentAt: new Date(),
    });
  } catch (error) {
    console.error('❌ Failed to send immediately:', error);
  }

  console.log('\n');

  // ============================================================================
  // Example 2: Queue notifications with BullMQ (Redis-backed)
  // ============================================================================
  console.log('Example 2: Queuing notifications with BullMQ (persisted in Redis)');
  console.log('-------------------------------------------------------------------');

  // Queue multiple notifications
  const users = [
    { name: 'Alice', email: 'alice@example.com' },
    { name: 'Bob', email: 'bob@example.com' },
    { name: 'Charlie', email: 'charlie@example.com' },
  ];

  for (const user of users) {
    const notification = new WelcomeEmailNotification(user.name);
    const recipient = {
      [NotificationChannel.EMAIL]: { email: user.email, name: user.name },
    };

    // Add to BullMQ queue (persisted in Redis)
    const job = await queueManager.enqueue(notification, recipient, {
      priority: JobPriority.NORMAL,
      maxRetries: 3,
    });

    console.log(`📬 Queued job ${job.id.substring(0, 8)} for ${user.name} (persisted in Redis)`);

    // Log to storage
    await storageManager.logNotification({
      notificationId: job.id,
      channel: NotificationChannel.EMAIL,
      recipient: user.email,
      status: NotificationLogStatus.SCHEDULED,
      subject: `Welcome to TownKrier, ${user.name}!`,
      content: 'Welcome email content',
      contentPrivacy: ContentPrivacy.MASKED,
      attempts: 0,
      retryLogs: [],
    });
  }

  console.log('\n');

  // ============================================================================
  // Example 3: Schedule notification for future delivery
  // ============================================================================
  console.log('Example 3: Scheduling notification for future delivery with BullMQ');
  console.log('---------------------------------------------------------------------');

  const scheduledNotification = new PasswordResetNotification('https://example.com/reset');
  const scheduledRecipient: NotificationRecipient = {
    [NotificationChannel.EMAIL]: { email: 'scheduled@example.com', name: 'Scheduled User' },
  };

  const scheduledTime = new Date(Date.now() + 30000); // 30 seconds from now
  const scheduledJob = await queueManager.enqueue(scheduledNotification, scheduledRecipient, {
    scheduledFor: scheduledTime,
    priority: JobPriority.HIGH,
  });

  console.log(
    `⏰ Scheduled job ${scheduledJob.id.substring(0, 8)} for ${scheduledTime.toLocaleTimeString()} (persisted in Redis)`,
  );

  console.log('\n');

  // ============================================================================
  // Example 4: View queue statistics
  // ============================================================================
  console.log('Example 4: BullMQ Queue Statistics');
  console.log('-----------------------------------');

  await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for processing

  const stats = await queueManager.getStats();
  console.log('Queue Stats (from Redis):', {
    pending: stats.pending,
    processing: stats.processing,
    completed: stats.completed,
    failed: stats.failed,
    retrying: stats.retrying,
    scheduled: stats.scheduled,
  });

  console.log('\n');

  // ============================================================================
  // Example 5: View notification logs
  // ============================================================================
  console.log('Example 5: Notification Logs');
  console.log('----------------------------');

  const logs = await storageManager.queryLogs({
    limit: 5,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  console.log(`Found ${logs.total} logs, showing ${logs.logs.length}:`);
  logs.logs.forEach((log) => {
    console.log(`  - ${log.channel}: ${log.recipient} [${log.status}]`);
  });

  console.log('\n');

  console.log('================================================');
  console.log('✅ Demo complete!');
  console.log('');
  console.log('📊 Visit http://localhost:3000/dashboard to view the EJS dashboard');
  console.log('   Features:');
  console.log('   - Overview with real-time stats');
  console.log('   - Jobs list with filtering');
  console.log('   - Job details with execution logs');
  console.log('   - Notification logs with preview/raw tabs');
  console.log('   - Delivery analysis with metrics');
  console.log('');
  console.log('🔧 Redis Connection:');
  console.log(`   - Host: ${process.env.REDIS_HOST || 'localhost'}`);
  console.log(`   - Port: ${process.env.REDIS_PORT || '6379'}`);
  console.log(`   - Queue: townkrier-notifications`);
  console.log('');
  console.log('Press Ctrl+C to stop the servers');
}

// ============================================================================
// Run the demo
// ============================================================================

demonstrateBullMQQueue().catch((error) => {
  console.error('❌ Demo failed:', error);
  console.error('');
  console.error('💡 Make sure Redis is running:');
  console.error('   docker run -d -p 6379:6379 redis:alpine');
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Shutting down...');
  await queueManager.stopProcessing();
  dashboardServer.stop();

  // Close BullMQ connections
  const adapter = queueManager.getAdapter();
  if (adapter && 'close' in adapter && typeof adapter.close === 'function') {
    await adapter.close();
  }

  console.log('✅ Shutdown complete');
  process.exit(0);
});
