import {
  NotificationManager,
  Notification,
  NotificationChannel,
  NotificationPriority,
} from '@townkrier/core';
import { QueueManager, InMemoryQueueAdapter, JobPriority } from '@townkrier/queue';
import {
  StorageManager,
  InMemoryStorageAdapter,
  NotificationLogStatus,
  ContentPrivacy,
} from '@townkrier/storage';
import { DashboardServer } from '@townkrier/dashboard';
import { createResendChannel } from '@townkrier/resend';

/**
 * Example demonstrating the queue system with retry logic and dashboard
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
// 2. Setup Queue Manager with Retry Logic
// ============================================================================

const queueAdapter = new InMemoryQueueAdapter({
  maxRetries: 3, // Maximum retry attempts (Hangfire-like)
  retryDelay: 1000, // Initial retry delay in ms (exponential backoff)
  timeout: 30000, // Job timeout
  pollInterval: 1000, // How often to check for new jobs
});

const queueManager = new QueueManager(queueAdapter, notificationManager);

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
// 4. Setup Dashboard (Hangfire-like UI)
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
      html: `<h1>Welcome ${this.userName}!</h1><p>Thank you for joining TownKrier notification system.</p>`,
      text: `Welcome ${this.userName}! Thank you for joining TownKrier notification system.`,
      message: `Welcome ${this.userName}!`,
    };
  }
}

class PasswordResetNotification extends Notification {
  constructor(private resetLink: string) {
    super();
    this.priority = NotificationPriority.CRITICAL;
  }

  via(): NotificationChannel[] {
    return [NotificationChannel.EMAIL];
  }

  toEmail() {
    return {
      subject: 'Password Reset Request',
      html: `<p>Click here to reset your password: <a href="${this.resetLink}">Reset Password</a></p>`,
      text: `Reset your password: ${this.resetLink}`,
      message: 'Password reset requested',
    };
  }
}

// ============================================================================
// 6. Demonstrate Usage
// ============================================================================

async function demonstrateQueueAndDashboard() {
  console.log('🚀 Starting TownKrier Queue and Dashboard Demo');
  console.log('================================================\n');

  // Start the queue processing
  console.log('📋 Starting queue processor...');
  queueManager.startProcessing({ pollInterval: 2000 });

  // Start the dashboard server
  console.log('🖥️  Starting dashboard server...');
  dashboardServer.start();
  console.log(`📊 Dashboard available at: http://localhost:3000/dashboard\n`);

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
    const result1 = await queueManager.sendNow(notification1, recipient1);
    console.log('✅ Sent immediately:', result1);

    // Log to storage
    await storageManager.logNotification({
      notificationId: notification1.reference || 'notif-1',
      channel: NotificationChannel.EMAIL,
      recipient: 'john@example.com',
      status: NotificationLogStatus.SENT,
      subject: 'Welcome to TownKrier, John Doe!',
      content: 'Welcome email content',
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
  // Example 2: Queue notification for background processing (like Laravel's send)
  // ============================================================================
  console.log('Example 2: Queuing notifications for background processing');
  console.log('-----------------------------------------------------------');

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

    // Add to queue for background processing
    const job = await queueManager.enqueue(notification, recipient, {
      priority: JobPriority.NORMAL,
      maxRetries: 3,
    });

    console.log(`📬 Queued job ${job.id.substring(0, 8)} for ${user.name}`);

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
  console.log('Example 3: Scheduling notification for future delivery');
  console.log('-------------------------------------------------------');

  const scheduledNotification = new PasswordResetNotification('https://example.com/reset');
  const scheduledRecipient = {
    [NotificationChannel.EMAIL]: { email: 'scheduled@example.com', name: 'Scheduled User' },
  };

  const scheduledTime = new Date(Date.now() + 10000); // 10 seconds from now
  const scheduledJob = await queueManager.enqueue(scheduledNotification, scheduledRecipient, {
    scheduledFor: scheduledTime,
    priority: JobPriority.HIGH,
  });

  console.log(
    `⏰ Scheduled job ${scheduledJob.id.substring(0, 8)} for ${scheduledTime.toLocaleTimeString()}`,
  );

  console.log('\n');

  // ============================================================================
  // Example 4: View queue statistics
  // ============================================================================
  console.log('Example 4: Queue Statistics');
  console.log('---------------------------');

  await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait for processing

  const stats = await queueManager.getStats();
  console.log('Queue Stats:', {
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

  // ============================================================================
  // Example 6: View storage statistics
  // ============================================================================
  console.log('Example 6: Storage Statistics');
  console.log('-----------------------------');

  const storageStats = await storageManager.getStats();
  console.log('Storage Stats:', {
    total: storageStats.total,
    sent: storageStats.sent,
    failed: storageStats.failed,
    byChannel: storageStats.byChannel,
    byStatus: storageStats.byStatus,
  });

  console.log('\n');
  console.log('================================================');
  console.log('✅ Demo complete!');
  console.log(`📊 Visit http://localhost:3000/dashboard to view the dashboard`);
  console.log('Press Ctrl+C to stop the servers');
}

// ============================================================================
// Run the demo
// ============================================================================

demonstrateQueueAndDashboard().catch((error) => {
  console.error('❌ Demo failed:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down...');
  queueManager.stopProcessing();
  dashboardServer.stop();
  process.exit(0);
});
