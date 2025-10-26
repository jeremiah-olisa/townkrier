import {
  NotificationManager,
  Notification,
  NotificationChannel,
  NotificationPriority,
} from '@townkrier/core';
import {
  createInAppChannel,
  InMemoryInAppStorageAdapter,
  DatabaseInAppChannel,
} from '@townkrier/in-app';
import express from 'express';

/**
 * Example demonstrating in-app notification system
 * This shows how to send, retrieve, and manage in-app notifications
 */

// ============================================================================
// 1. Setup In-Memory Storage Adapter
// ============================================================================

const storageAdapter = new InMemoryInAppStorageAdapter();

// ============================================================================
// 2. Setup Notification Manager with In-App Channel
// ============================================================================

const notificationManager = new NotificationManager({
  defaultChannel: 'in-app',
  channels: [
    {
      name: 'in-app',
      enabled: true,
      priority: 10,
      config: {
        storageAdapter,
      },
    },
  ],
});

// Register the in-app channel factory
notificationManager.registerFactory('in-app', createInAppChannel);

// Get the in-app channel for direct operations
const inAppChannel = notificationManager.getChannel('in-app') as DatabaseInAppChannel;

// ============================================================================
// 3. Create Sample Notification Classes
// ============================================================================

class WelcomeNotification extends Notification {
  constructor(private userName: string) {
    super();
    this.priority = NotificationPriority.NORMAL;
  }

  via(): NotificationChannel[] {
    return [NotificationChannel.IN_APP];
  }

  toInApp() {
    return {
      title: 'Welcome!',
      message: `Welcome to our app, ${this.userName}! 🎉`,
      type: 'welcome',
      icon: '🎉',
      data: {
        userName: this.userName,
      },
    };
  }
}

class NewMessageNotification extends Notification {
  constructor(
    private senderName: string,
    private messagePreview: string,
  ) {
    super();
    this.priority = NotificationPriority.HIGH;
  }

  via(): NotificationChannel[] {
    return [NotificationChannel.IN_APP];
  }

  toInApp() {
    return {
      title: `New message from ${this.senderName}`,
      message: this.messagePreview,
      type: 'message',
      icon: '💬',
      actionUrl: '/messages',
    };
  }
}

class SystemAlertNotification extends Notification {
  constructor(
    private alertTitle: string,
    private alertMessage: string,
  ) {
    super();
    this.priority = NotificationPriority.URGENT;
  }

  via(): NotificationChannel[] {
    return [NotificationChannel.IN_APP];
  }

  toInApp() {
    return {
      title: this.alertTitle,
      message: this.alertMessage,
      type: 'system',
      icon: '⚠️',
    };
  }
}

// ============================================================================
// 4. Demonstrate Sending Notifications
// ============================================================================

async function demonstrateInAppNotifications() {
  console.log('🔔 In-App Notification System Demo');
  console.log('===================================\n');

  const userId1 = 'user-123';
  const userId2 = 'user-456';

  // Send welcome notification
  console.log('Example 1: Sending welcome notification');
  console.log('----------------------------------------');
  const welcomeNotif = new WelcomeNotification('John Doe');
  const welcomeResult = await notificationManager.send(welcomeNotif, {
    [NotificationChannel.IN_APP]: { userId: userId1 },
  });
  console.log('✅ Welcome notification sent:', welcomeResult.get(NotificationChannel.IN_APP));
  console.log('');

  // Send multiple message notifications
  console.log('Example 2: Sending message notifications');
  console.log('----------------------------------------');
  const messageNotif1 = new NewMessageNotification('Alice', 'Hey, how are you doing?');
  await notificationManager.send(messageNotif1, {
    [NotificationChannel.IN_APP]: { userId: userId1 },
  });
  console.log('✅ Message notification 1 sent');

  const messageNotif2 = new NewMessageNotification('Bob', 'Meeting at 3 PM today');
  await notificationManager.send(messageNotif2, {
    [NotificationChannel.IN_APP]: { userId: userId1 },
  });
  console.log('✅ Message notification 2 sent');
  console.log('');

  // Send system alert
  console.log('Example 3: Sending system alert');
  console.log('--------------------------------');
  const systemNotif = new SystemAlertNotification(
    'Scheduled Maintenance',
    'System maintenance scheduled for tomorrow at 2 AM',
  );
  await notificationManager.send(systemNotif, {
    [NotificationChannel.IN_APP]: [{ userId: userId1 }, { userId: userId2 }],
  });
  console.log('✅ System alert sent to multiple users');
  console.log('');

  // ============================================================================
  // 5. Retrieve and Display Notifications
  // ============================================================================

  console.log('Example 4: Retrieving notifications');
  console.log('------------------------------------');

  // Get all notifications for user 1
  const allNotifications = await inAppChannel.getNotificationsForUser(userId1);
  console.log(`📬 User ${userId1} has ${allNotifications.length} notifications:`);
  allNotifications.forEach((notif, index) => {
    console.log(
      `  ${index + 1}. ${notif.icon || '📬'} ${notif.title} - ${notif.read ? 'Read' : 'Unread'}`,
    );
  });
  console.log('');

  // Get unread notifications only
  const unreadNotifications = await inAppChannel.getNotificationsForUser(userId1, {
    unreadOnly: true,
  });
  console.log(`📭 User ${userId1} has ${unreadNotifications.length} unread notifications`);
  console.log('');

  // Count unread notifications
  const unreadCount = await inAppChannel.countUnread(userId1);
  console.log(`🔢 Unread count for ${userId1}: ${unreadCount}`);
  console.log('');

  // ============================================================================
  // 6. Mark Notifications as Read
  // ============================================================================

  console.log('Example 5: Marking notifications as read');
  console.log('-----------------------------------------');

  if (allNotifications.length > 0) {
    const firstNotif = allNotifications[0];
    await inAppChannel.markAsRead(firstNotif.id);
    console.log(`✅ Marked notification "${firstNotif.title}" as read`);

    const updatedCount = await inAppChannel.countUnread(userId1);
    console.log(`🔢 Updated unread count: ${updatedCount}`);
  }
  console.log('');

  // ============================================================================
  // 7. Mark All as Read
  // ============================================================================

  console.log('Example 6: Marking all notifications as read');
  console.log('----------------------------------------------');
  await inAppChannel.markAllAsRead(userId1);
  console.log('✅ All notifications marked as read');

  const finalCount = await inAppChannel.countUnread(userId1);
  console.log(`🔢 Final unread count: ${finalCount}`);
  console.log('');

  // ============================================================================
  // 8. Delete Notification
  // ============================================================================

  console.log('Example 7: Deleting a notification');
  console.log('-----------------------------------');
  if (allNotifications.length > 0) {
    await inAppChannel.deleteNotification(allNotifications[0].id);
    console.log('✅ Notification deleted');

    const remainingNotifications = await inAppChannel.getNotificationsForUser(userId1);
    console.log(`📬 Remaining notifications: ${remainingNotifications.length}`);
  }
  console.log('');
}

// ============================================================================
// 9. Setup Express API for In-App Notifications
// ============================================================================

function setupExpressAPI() {
  const app = express();
  app.use(express.json());

  // Middleware to simulate authentication (replace with your auth)
  app.use((req, res, next) => {
    // @ts-expect-error - Adding user for demo purposes
    req.user = { id: 'user-123' }; // In real app, get from JWT/session
    next();
  });

  // Get notifications for current user
  app.get('/api/notifications', async (req, res) => {
    try {
      // @ts-expect-error - user added in middleware
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const unreadOnly = req.query.unread === 'true';

      const notifications = await inAppChannel.getNotificationsForUser(userId, {
        limit,
        offset,
        unreadOnly,
      });

      const unreadCount = await inAppChannel.countUnread(userId);

      res.json({
        notifications,
        unreadCount,
        total: notifications.length,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  });

  // Get single notification
  app.get('/api/notifications/:id', async (req, res) => {
    try {
      const notification = await inAppChannel.getNotification(req.params.id);

      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      res.json(notification);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch notification' });
    }
  });

  // Mark notification as read
  app.post('/api/notifications/:id/read', async (req, res) => {
    try {
      await inAppChannel.markAsRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to mark as read' });
    }
  });

  // Mark all notifications as read
  app.post('/api/notifications/read-all', async (req, res) => {
    try {
      // @ts-expect-error - user added in middleware
      const userId = req.user.id;
      await inAppChannel.markAllAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to mark all as read' });
    }
  });

  // Delete notification
  app.delete('/api/notifications/:id', async (req, res) => {
    try {
      await inAppChannel.deleteNotification(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete notification' });
    }
  });

  // Get unread count
  app.get('/api/notifications/unread-count', async (req, res) => {
    try {
      // @ts-expect-error - user added in middleware
      const userId = req.user.id;
      const count = await inAppChannel.countUnread(userId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get unread count' });
    }
  });

  return app;
}

// ============================================================================
// 10. Run the Demo
// ============================================================================

async function main() {
  // Run console demo
  await demonstrateInAppNotifications();

  // Setup Express API
  const app = setupExpressAPI();
  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`\n🚀 Express API running on http://localhost:${PORT}`);
    console.log('\nAvailable endpoints:');
    console.log('  GET    /api/notifications           - Get notifications');
    console.log('  GET    /api/notifications/:id       - Get single notification');
    console.log('  POST   /api/notifications/:id/read  - Mark as read');
    console.log('  POST   /api/notifications/read-all  - Mark all as read');
    console.log('  DELETE /api/notifications/:id       - Delete notification');
    console.log('  GET    /api/notifications/unread-count - Get unread count');
  });
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

export { demonstrateInAppNotifications, setupExpressAPI };
