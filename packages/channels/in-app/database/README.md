# townkrier-in-app

In-app/database notification adapter for the TownKrier notification system. This package provides a channel for storing notifications in a database for display within your application (similar to notification bells in modern apps).

## Installation

```bash
npm install townkrier-in-app
# or
pnpm add townkrier-in-app
# or
yarn add townkrier-in-app
```

## Features

- 📬 Store notifications in any database
- 📖 Mark notifications as read/unread
- 🗑️ Delete notifications
- 📊 Count unread notifications
- 🔍 Query notifications by user
- 💾 Pluggable storage adapter architecture

## Usage

### Basic Setup

```typescript
import { NotificationManager } from 'townkrier-core';
import { createInAppChannel, InMemoryInAppStorageAdapter } from 'townkrier-in-app';

// 1. Create a storage adapter
const storageAdapter = new InMemoryInAppStorageAdapter();

// 2. Setup notification manager
const notificationManager = new NotificationManager({
  defaultChannel: 'in-app',
  channels: [
    {
      name: 'in-app',
      enabled: true,
      config: {
        storageAdapter,
      },
    },
  ],
});

// 3. Register the in-app channel
notificationManager.registerFactory('in-app', createInAppChannel);
```

### Sending In-App Notifications

```typescript
import { NotificationChannel } from 'townkrier-core';

// Send to single user
await notificationManager.send(
  {
    title: 'Welcome!',
    message: 'Welcome to our application',
    type: 'welcome',
    actionUrl: '/getting-started',
    icon: '🎉',
  },
  {
    [NotificationChannel.IN_APP]: { userId: 'user-123' },
  },
);

// Send to multiple users
await notificationManager.send(
  {
    title: 'New Feature',
    message: 'Check out our new feature',
    type: 'announcement',
  },
  {
    [NotificationChannel.IN_APP]: [
      { userId: 'user-123' },
      { userId: 'user-456' },
      { userId: 'user-789' },
    ],
  },
);
```

### Reading Notifications

```typescript
const channel = notificationManager.getChannel('in-app') as DatabaseInAppChannel;

// Get notifications for a user
const notifications = await channel.getNotificationsForUser('user-123', {
  limit: 10,
  unreadOnly: true,
});

// Count unread notifications
const unreadCount = await channel.countUnread('user-123');

// Mark a notification as read
await channel.markAsRead('notification-id');

// Mark all notifications as read
await channel.markAllAsRead('user-123');

// Delete a notification
await channel.deleteNotification('notification-id');
```

## Custom Storage Adapter

The in-memory adapter is suitable for testing, but for production you should implement a database-backed adapter:

```typescript
import { InAppStorageAdapter, InAppNotificationData } from 'townkrier-in-app';

class MongoDBStorageAdapter implements InAppStorageAdapter {
  private db: MongoClient;

  constructor(connectionString: string) {
    this.db = new MongoClient(connectionString);
  }

  async save(notification: InAppNotificationData): Promise<string> {
    const result = await this.db
      .db('app')
      .collection('notifications')
      .insertOne({
        ...notification,
        _id: new ObjectId(),
        createdAt: new Date(),
      });

    return result.insertedId.toString();
  }

  async get(id: string): Promise<InAppNotificationData | null> {
    const doc = await this.db
      .db('app')
      .collection('notifications')
      .findOne({ _id: new ObjectId(id) });

    if (!doc) return null;

    return {
      id: doc._id.toString(),
      userId: doc.userId,
      title: doc.title,
      message: doc.message,
      type: doc.type,
      actionUrl: doc.actionUrl,
      icon: doc.icon,
      data: doc.data,
      read: doc.read,
      readAt: doc.readAt,
      createdAt: doc.createdAt,
      metadata: doc.metadata,
    };
  }

  async getForUser(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
    },
  ): Promise<InAppNotificationData[]> {
    const query: any = { userId };
    if (options?.unreadOnly) {
      query.read = false;
    }

    const docs = await this.db
      .db('app')
      .collection('notifications')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(options?.offset || 0)
      .limit(options?.limit || 50)
      .toArray();

    return docs.map((doc) => ({
      id: doc._id.toString(),
      userId: doc.userId,
      title: doc.title,
      message: doc.message,
      type: doc.type,
      actionUrl: doc.actionUrl,
      icon: doc.icon,
      data: doc.data,
      read: doc.read,
      readAt: doc.readAt,
      createdAt: doc.createdAt,
      metadata: doc.metadata,
    }));
  }

  async markAsRead(id: string): Promise<void> {
    await this.db
      .db('app')
      .collection('notifications')
      .updateOne({ _id: new ObjectId(id) }, { $set: { read: true, readAt: new Date() } });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.db
      .db('app')
      .collection('notifications')
      .updateMany({ userId, read: false }, { $set: { read: true, readAt: new Date() } });
  }

  async delete(id: string): Promise<void> {
    await this.db
      .db('app')
      .collection('notifications')
      .deleteOne({ _id: new ObjectId(id) });
  }

  async countUnread(userId: string): Promise<number> {
    return await this.db
      .db('app')
      .collection('notifications')
      .countDocuments({ userId, read: false });
  }
}
```

## API Integration Example

```typescript
import express from 'express';
import { NotificationManager, NotificationChannel } from 'townkrier-core';
import { createInAppChannel, DatabaseInAppChannel } from 'townkrier-in-app';

const app = express();
app.use(express.json());

// Setup notification manager (see above)
const notificationManager = new NotificationManager(/* ... */);
const inAppChannel = notificationManager.getChannel('in-app') as DatabaseInAppChannel;

// Get notifications for current user
app.get('/api/notifications', async (req, res) => {
  const userId = req.user.id; // From your auth middleware
  const notifications = await inAppChannel.getNotificationsForUser(userId, {
    limit: parseInt(req.query.limit as string) || 20,
    offset: parseInt(req.query.offset as string) || 0,
    unreadOnly: req.query.unread === 'true',
  });

  const unreadCount = await inAppChannel.countUnread(userId);

  res.json({ notifications, unreadCount });
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

// Mark all as read
app.post('/api/notifications/read-all', async (req, res) => {
  const userId = req.user.id;
  try {
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
```

## TypeScript Support

This package is written in TypeScript and provides full type definitions.

## License

MIT
