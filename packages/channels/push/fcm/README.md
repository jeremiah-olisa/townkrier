# @townkrier/fcm

Firebase Cloud Messaging (FCM) push notification adapter for the TownKrier notification system.

## Features

- 📱 Push notifications for iOS and Android
- 🔔 Rich notifications with images, actions, and badges
- 🎯 Target specific devices, topics, or user segments
- 📊 Delivery tracking and analytics
- 🔄 Automatic retry with exponential backoff
- 🌐 Multi-language support
- 🔒 Secure authentication with service account

## Installation

```bash
npm install @townkrier/fcm @townkrier/core
# or
pnpm add @townkrier/fcm @townkrier/core
```

## Quick Start

```typescript
import { NotificationManager, NotificationChannel } from '@townkrier/core';
import { createFcmChannel } from '@townkrier/fcm';

// Configure the manager with FCM channel
const manager = new NotificationManager({
  defaultChannel: 'push-fcm',
  channels: [
    {
      name: 'push-fcm',
      enabled: true,
      config: {
        projectId: process.env.FIREBASE_PROJECT_ID,
        serviceAccountPath: './firebase-service-account.json',
        // Or use service account key directly:
        // serviceAccountKey: JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT),
      },
    },
  ],
});

// Register the FCM channel factory
manager.registerFactory('push-fcm', createFcmChannel);

// Create a notification
class WelcomePushNotification extends Notification {
  constructor(private userName: string) {
    super();
  }

  via() {
    return [NotificationChannel.PUSH];
  }

  toPush() {
    return {
      token: 'device-fcm-token-here',
      notification: {
        title: 'Welcome! 👋',
        body: `Hi ${this.userName}, thanks for joining!`,
      },
    };
  }
}

// Send the notification
const notification = new WelcomePushNotification('John');
const recipient = {
  [NotificationChannel.PUSH]: {
    token: 'device-fcm-token',
  },
};

await manager.send(notification, recipient);
```

## Configuration

### FcmConfig

```typescript
interface FcmConfig {
  projectId: string; // Required: Firebase project ID
  serviceAccountPath?: string; // Path to service account JSON file
  serviceAccountKey?: object; // Or service account key object
  timeout?: number; // Request timeout (default: 30000ms)
  debug?: boolean; // Enable debug logging (default: false)
}
```

### Getting Service Account Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Project Settings → Service Accounts
4. Click "Generate New Private Key"
5. Save the JSON file securely

```typescript
// Option 1: Using file path
{
  projectId: 'your-project-id',
  serviceAccountPath: './firebase-service-account.json',
}

// Option 2: Using environment variable
{
  projectId: process.env.FIREBASE_PROJECT_ID,
  serviceAccountKey: JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT),
}
```

## Advanced Usage

### Rich Notifications with Images

```typescript
class OrderShippedNotification extends Notification {
  constructor(
    private orderNumber: string,
    private trackingUrl: string,
    private productImage: string,
  ) {
    super();
  }

  via() {
    return [NotificationChannel.PUSH];
  }

  toPush() {
    return {
      token: 'device-token',
      notification: {
        title: '📦 Order Shipped!',
        body: `Order #${this.orderNumber} is on its way`,
        imageUrl: this.productImage,
      },
      data: {
        orderId: this.orderNumber,
        trackingUrl: this.trackingUrl,
        action: 'view_order',
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'order_updates',
          color: '#FF6B6B',
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            badge: 1,
            sound: 'default',
          },
        },
      },
    };
  }
}
```

### Topic-Based Notifications

```typescript
class NewsAlertNotification extends Notification {
  constructor(private headline: string) {
    super();
  }

  via() {
    return [NotificationChannel.PUSH];
  }

  toPush() {
    return {
      topic: 'news-alerts', // Send to all devices subscribed to this topic
      notification: {
        title: '📰 Breaking News',
        body: this.headline,
      },
    };
  }
}
```

### Conditional Notifications (Multiple Devices)

```typescript
class SecurityAlertNotification extends Notification {
  via() {
    return [NotificationChannel.PUSH];
  }

  toPush() {
    return {
      condition: "'security-alerts' in topics || 'all-devices' in topics",
      notification: {
        title: '🔒 Security Alert',
        body: 'Unusual activity detected on your account',
      },
      android: {
        priority: 'high',
      },
      apns: {
        payload: {
          aps: {
            'content-available': 1, // Silent notification for background updates
          },
        },
      },
    };
  }
}
```

### Platform-Specific Customization

```typescript
class ChatMessageNotification extends Notification {
  constructor(
    private senderName: string,
    private message: string,
    private chatId: string,
  ) {
    super();
  }

  via() {
    return [NotificationChannel.PUSH];
  }

  toPush() {
    return {
      token: 'device-token',
      notification: {
        title: this.senderName,
        body: this.message,
      },
      data: {
        chatId: this.chatId,
        type: 'chat_message',
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'chat_messages',
          color: '#4A90E2',
          sound: 'chat_notification.mp3',
          tag: this.chatId, // Group notifications by chat
        },
      },
      apns: {
        headers: {
          'apns-priority': '10',
        },
        payload: {
          aps: {
            alert: {
              title: this.senderName,
              body: this.message,
            },
            badge: 1,
            sound: 'chat_notification.caf',
            category: 'CHAT_MESSAGE',
            'thread-id': this.chatId, // Group notifications by chat
          },
        },
      },
    };
  }
}
```

### Scheduled Notifications

```typescript
import { QueueManager } from '@townkrier/queue';

// Schedule notification for future delivery
const queueManager = new QueueManager(queueAdapter, manager);

await queueManager.enqueue(notification, recipient, {
  scheduledFor: new Date(Date.now() + 3600000), // Send in 1 hour
});
```

## Message Types

### Data Messages (Silent)

```typescript
{
  token: 'device-token',
  data: {
    type: 'sync',
    timestamp: Date.now().toString(),
  },
  // No notification field = silent data message
}
```

### Notification Messages

```typescript
{
  token: 'device-token',
  notification: {
    title: 'New Message',
    body: 'You have a new message',
  },
  // User sees this in notification tray
}
```

### Combined Messages

```typescript
{
  token: 'device-token',
  notification: {
    title: 'New Message',
    body: 'You have a new message',
  },
  data: {
    messageId: '12345',
    senderId: 'user_789',
  },
  // Both visible notification and background data
}
```

## Device Token Management

### Getting Device Tokens

On the client side (iOS/Android):

```javascript
// React Native example
import messaging from '@react-native-firebase/messaging';

const token = await messaging().getToken();
// Store this token in your backend for the user
```

### Token Refresh

Tokens can change, so handle token refresh:

```javascript
messaging().onTokenRefresh(async (newToken) => {
  // Update token in your backend
  await updateUserToken(userId, newToken);
});
```

## Topic Management

### Subscribe to Topics (Client Side)

```javascript
import messaging from '@react-native-firebase/messaging';

await messaging().subscribeToTopic('news-alerts');
await messaging().subscribeToTopic('promotions');
```

### Unsubscribe from Topics

```javascript
await messaging().unsubscribeFromTopic('news-alerts');
```

## Error Handling

```typescript
import { NotificationFailed } from '@townkrier/core';

eventDispatcher.on(NotificationFailed, async (event) => {
  console.error('Push notification failed:', event.error.message);

  // Handle specific FCM errors
  if (event.error.message.includes('invalid-registration-token')) {
    // Remove invalid token from database
    await removeUserToken(userId);
  } else if (event.error.message.includes('message-rate-exceeded')) {
    // Implement rate limiting
    await delayNextNotification(userId);
  }
});
```

### Common Errors

- `invalid-registration-token` - Token is invalid, expired, or deleted
- `registration-token-not-registered` - Token not registered
- `message-rate-exceeded` - Too many messages to same device
- `invalid-apns-credentials` - Invalid iOS certificates

## Testing

### Test Mode

```typescript
{
  projectId: 'your-project-id',
  serviceAccountPath: './firebase-service-account.json',
  debug: true, // Enable detailed logging
}
```

### Testing with FCM Console

1. Go to Firebase Console → Cloud Messaging
2. Click "Send Test Message"
3. Enter device token
4. Test your notification

### Testing Locally

Use the Firebase Emulator Suite for local testing:

```bash
firebase emulators:start --only messaging
```

## Best Practices

1. **Token Management**: Keep device tokens up to date
2. **Handle Token Refresh**: Update tokens when they change
3. **Remove Invalid Tokens**: Clean up invalid tokens from your database
4. **Respect User Preferences**: Allow users to control notification types
5. **Use Topics Wisely**: Group users by interests, not individual targeting
6. **Optimize Payload Size**: Keep data payloads small (4KB limit)
7. **Test on Real Devices**: Emulators don't fully simulate push behavior
8. **Handle Time Zones**: Consider user time zones for scheduled notifications
9. **Rate Limiting**: Don't overwhelm users with too many notifications
10. **Analytics**: Track delivery rates and user engagement

## Notification Channels (Android)

For Android 8.0+, create notification channels in your app:

```java
// Android example
NotificationChannel channel = new NotificationChannel(
    "order_updates",
    "Order Updates",
    NotificationManager.IMPORTANCE_HIGH
);
channel.setDescription("Notifications about your orders");
NotificationManager manager = getSystemService(NotificationManager.class);
manager.createNotificationChannel(channel);
```

## iOS Considerations

### APNs Certificates

FCM handles APNs certificates automatically, but ensure:

- Your APNs key is properly configured in Firebase Console
- Your app has the correct bundle ID
- Push notification capability is enabled in Xcode

### Background Notifications

```typescript
{
  token: 'device-token',
  apns: {
    payload: {
      aps: {
        'content-available': 1, // Enable background updates
        badge: 0,
      },
    },
  },
  data: {
    type: 'background_sync',
  },
}
```

## Troubleshooting

### "Service account not found"

- Verify service account JSON file exists
- Check file path is correct
- Ensure file has proper read permissions

### "Project ID mismatch"

- Verify project ID matches your Firebase project
- Check service account belongs to correct project

### "Invalid token"

- Token may have expired or been deleted
- User may have uninstalled the app
- Remove token from your database

### Notifications not received

- Check device is connected to internet
- Verify app has notification permissions
- Check notification channel settings (Android)
- Verify APNs configuration (iOS)

## Pricing

FCM is free for:

- Unlimited notifications
- All features

Additional Firebase services may have costs. Check [Firebase Pricing](https://firebase.google.com/pricing).

## Related Packages

- [@townkrier/core](../../core) - Core notification system
- [@townkrier/resend](../../resend) - Email provider
- [@townkrier/termii](../sms/termii) - SMS provider
- [@townkrier/queue](../../queue) - Queue system for background processing
- [@townkrier/dashboard](../../dashboard) - Monitoring dashboard

## Examples

See the [examples directory](../../../../examples) for complete working examples:

- [Complete Example](../../../../examples/complete-example.ts) - Full multi-channel setup
- [Push Notification Examples](../../../../examples/notifications) - FCM-specific examples

## Resources

- [FCM Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [React Native Firebase](https://rnfirebase.io/)
- [TownKrier Documentation](../../../../README.md)

## License

MIT

## Support

- [Report Issues](https://github.com/jeremiah-olisa/townkrier/issues)
- [Firebase Support](https://firebase.google.com/support)

## Author

Jeremiah Olisa
