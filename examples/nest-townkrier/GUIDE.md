# TownKrier NestJS Integration - Complete Guide

This is a complete, production-ready example of integrating TownKrier notification system with NestJS.

## 🎯 What's Included

### ✅ Complete Notification System

- **Multiple Channels**: Email, SMS, Push (easily extensible)
- **Queue Management**: Background processing with retry logic
- **Dashboard**: Real-time monitoring (Hangfire-style UI)
- **Event System**: Listen to notification events
- **Fallback Support**: Automatic fallback to alternate channels

### ✅ NestJS Best Practices

- Modular architecture with services, controllers, and DTOs
- Input validation with class-validator
- Configuration management with @nestjs/config
- Swagger API documentation
- TypeScript strict mode
- Dependency injection

### ✅ Production Features

- Error handling and logging
- Queue retry with exponential backoff
- Job prioritization
- Scheduled notifications
- Bulk notification support
- Health checks

## 📁 Project Structure

```
src/
├── notifications/
│   ├── classes/                    # Notification implementations
│   │   ├── welcome.notification.ts
│   │   ├── order-confirmation.notification.ts
│   │   ├── password-reset.notification.ts
│   │   └── payment-received.notification.ts
│   │
│   ├── controllers/                # API endpoints
│   │   ├── notifications.controller.ts
│   │   └── queue.controller.ts
│   │
│   ├── dto/                        # Data transfer objects
│   │   ├── send-notification.dto.ts
│   │   └── notification-response.dto.ts
│   │
│   ├── services/                   # Business logic
│   │   ├── notification.service.ts
│   │   └── dashboard.service.ts
│   │
│   └── notifications.module.ts     # Module definition
│
├── app.module.ts                   # Root module
└── main.ts                         # Bootstrap
```

## 🚀 Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
# Required for email notifications
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=notifications@yourdomain.com
RESEND_FROM_NAME=Your App Name

# Optional: Add more providers
TERMII_API_KEY=your_termii_api_key
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/firebase.json
```

### 3. Start the Application

```bash
# Development mode with hot reload
pnpm run start:dev

# Production mode
pnpm run build
pnpm run start:prod
```

### 4. Access the Services

- **API Server**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api
- **TownKrier Dashboard**: http://localhost:4000/townkrier/dashboard

## 📚 Usage Examples

### Send Notification Immediately

```bash
curl -X POST http://localhost:3000/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "welcome",
    "email": "user@example.com",
    "name": "John Doe"
  }'
```

### Queue Notification with Delay

```bash
curl -X POST http://localhost:3000/notifications/queue \
  -H "Content-Type: application/json" \
  -d '{
    "type": "order_confirmation",
    "email": "user@example.com",
    "name": "John Doe",
    "data": {
      "orderId": "ORD-12345",
      "amount": 99.99,
      "itemCount": 3
    },
    "delay": 5000,
    "priority": "high"
  }'
```

### Send Bulk Notifications

```bash
curl -X POST http://localhost:3000/notifications/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": [
      {"type": "welcome", "email": "user1@example.com", "name": "User 1"},
      {"type": "welcome", "email": "user2@example.com", "name": "User 2"}
    ]
  }'
```

### Get Queue Statistics

```bash
curl http://localhost:3000/queue/stats
```

## 🧪 Testing

Run the included test script:

```bash
node test-notifications.js
```

Or view all examples:

```bash
node EXAMPLES.js
```

## 📊 Dashboard Features

The TownKrier dashboard at `/townkrier/dashboard` provides:

- **Real-time Stats**: Active jobs, completed, failed, etc.
- **Job List**: View all queued and processed jobs
- **Job Details**: Inspect individual job data and logs
- **Retry Failed Jobs**: One-click retry for failed notifications
- **Metrics**: Success rates, average processing time, etc.

## 🔧 Adding Custom Notifications

### 1. Create Notification Class

```typescript
// src/notifications/classes/custom.notification.ts
import {
  Notification,
  NotificationChannel,
  NotificationPriority,
} from '@townkrier/core';

export class CustomNotification extends Notification {
  constructor(private customData: any) {
    super();
    this.priority = NotificationPriority.NORMAL;
  }

  via(): NotificationChannel[] {
    return [NotificationChannel.EMAIL];
  }

  toEmail() {
    return {
      subject: 'Custom Subject',
      html: '<h1>Custom HTML Content</h1>',
      text: 'Custom text content',
    };
  }
}
```

### 2. Add to DTO

```typescript
// In send-notification.dto.ts
export enum NotificationType {
  CUSTOM = 'custom',
  // ... existing types
}
```

### 3. Handle in Service

```typescript
// In notification.service.ts
private createNotification(dto: SendNotificationDto): Notification {
  switch (dto.type) {
    case NotificationType.CUSTOM:
      return new CustomNotification(dto.data);
    // ... existing cases
  }
}
```

## 📡 Adding More Channels

### SMS (Termii)

```bash
pnpm add @townkrier/termii
```

```typescript
// In notification.service.ts
import { createTermiiChannel } from '@townkrier/termii';

channels: [
  // ... existing channels
  {
    name: 'sms-termii',
    enabled: true,
    priority: 5,
    config: {
      apiKey: this.configService.get('TERMII_API_KEY'),
      senderId: this.configService.get('TERMII_SENDER_ID'),
      channel: 'generic',
    },
  },
];

// Register factory
this.notificationManager.registerFactory('sms-termii', createTermiiChannel);
```

Add `toSms()` to your notifications:

```typescript
toSms() {
  return {
    text: 'Your SMS message here',
  };
}
```

### Push Notifications (FCM)

```bash
pnpm add @townkrier/fcm
```

```typescript
// In notification.service.ts
import { createFcmChannel } from '@townkrier/fcm';

channels: [
  // ... existing channels
  {
    name: 'push-fcm',
    enabled: true,
    priority: 3,
    config: {
      serviceAccountPath: this.configService.get(
        'FIREBASE_SERVICE_ACCOUNT_PATH',
      ),
      projectId: this.configService.get('FIREBASE_PROJECT_ID'),
    },
  },
];

// Register factory
this.notificationManager.registerFactory('push-fcm', createFcmChannel);
```

## 🎨 Notification Types Included

1. **Welcome** - Onboarding email for new users
2. **Order Confirmation** - Order details with pricing
3. **Password Reset** - Secure password reset link
4. **Payment Received** - Payment confirmation with transaction details

Each notification includes:

- Beautiful HTML email template
- Plain text fallback
- Professional styling
- Responsive design

## 🔐 Security Best Practices

1. **Environment Variables**: Never commit API keys
2. **Validation**: All inputs are validated with class-validator
3. **CORS**: Configure CORS for your domain in production
4. **Dashboard Auth**: Enable authentication for dashboard in production:

```typescript
// In dashboard.service.ts
auth: {
  enabled: true,
  username: process.env.DASHBOARD_USERNAME,
  password: process.env.DASHBOARD_PASSWORD,
}
```

## 🚀 Production Deployment

### Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure real Redis for BullMQ (if using)
- [ ] Set up database for persistent storage
- [ ] Enable dashboard authentication
- [ ] Configure proper logging
- [ ] Set up monitoring and alerts
- [ ] Use environment-specific configs
- [ ] Enable HTTPS
- [ ] Configure rate limiting
- [ ] Set up backup strategy

### Environment Variables

```env
NODE_ENV=production
PORT=3000
DASHBOARD_PORT=4000

# Security
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=secure_password_here

# Email Provider
RESEND_API_KEY=production_key_here
RESEND_FROM_EMAIL=notifications@yourdomain.com

# Optional: SMS
TERMII_API_KEY=production_key_here

# Optional: Push
FIREBASE_SERVICE_ACCOUNT_PATH=/app/config/firebase.json
```

## 📈 Performance Tips

1. **Use Queue for Bulk Operations**: Always queue bulk notifications
2. **Set Appropriate Priorities**: Use job priorities wisely
3. **Configure Retry Logic**: Adjust retry settings based on your needs
4. **Monitor Dashboard**: Regularly check for failed jobs
5. **Clean Up Old Jobs**: Implement job cleanup strategy

## 🐛 Troubleshooting

### Notifications Not Sending

1. Check API keys in `.env`
2. Verify service is running: `curl http://localhost:3000/notifications/health`
3. Check logs for errors
4. Verify email provider (Resend) is configured

### Dashboard Not Loading

1. Check dashboard is running on port 4000
2. Verify path: `/townkrier/dashboard`
3. Check firewall settings
4. Review dashboard service logs

### Queue Not Processing

1. Verify queue manager is started
2. Check queue stats: `curl http://localhost:3000/queue/stats`
3. Look for errors in logs
4. Verify notification manager is initialized

## 📖 API Documentation

Full API documentation is available at:

- **Swagger UI**: http://localhost:3000/api

The Swagger docs include:

- All endpoints with examples
- Request/response schemas
- Try-it-out functionality
- Schema definitions

## 🤝 Contributing

Feel free to extend this example with:

- Additional notification types
- More channel adapters
- Custom styling
- Advanced features

## 📝 License

MIT

## 🔗 Links

- [TownKrier GitHub](https://github.com/jeremiah-olisa/townkrier)
- [NestJS Documentation](https://docs.nestjs.com)
- [Resend Docs](https://resend.com/docs)

---

**Happy Coding!** 🎉
