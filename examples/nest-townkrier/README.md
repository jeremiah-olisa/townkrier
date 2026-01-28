# NestJS TownKrier Integration Example

A complete example of integrating TownKrier multi-channel notification system with NestJS, featuring queue management, background processing, and a monitoring dashboard.

## Features

✅ **Multi-Channel Notifications**

- Email (Resend)
- SMS (Termii) - Ready to configure
- Push Notifications (FCM) - Ready to configure
- Extensible to add more channels

✅ **Queue System**

- Background job processing
- Automatic retry with exponential backoff
- Job prioritization
- Scheduled notifications

✅ **Monitoring Dashboard**

- Real-time notification monitoring
- Queue statistics and metrics
- Job history and logs
- Similar to Hangfire UI

✅ **Production Ready**

- TypeScript support
- Input validation with class-validator
- Swagger API documentation
- Error handling and logging
- CORS enabled

## Installation

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Edit .env and add your API keys
nano .env
```

## Configuration

Edit `.env` file and configure your notification providers:

```env
# Required: Resend Email
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=notifications@yourdomain.com

# Optional: Other providers
TERMII_API_KEY=your_termii_key
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/firebase.json
```

## Running the Application

```bash
# Development mode
pnpm run start:dev

# Production mode
pnpm run build
pnpm run start:prod
```

The application will start on:

- **API Server**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api
- **TownKrier Dashboard**: http://localhost:4000/townkrier/dashboard

## API Endpoints

### Send Notification Immediately

```bash
POST http://localhost:3000/notifications/send
Content-Type: application/json

{
  "type": "welcome",
  "email": "user@example.com",
  "name": "John Doe"
}
```

### Queue Notification (Background Processing)

```bash
POST http://localhost:3000/notifications/queue
Content-Type: application/json

{
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
}
```

### Send Bulk Notifications

```bash
POST http://localhost:3000/notifications/bulk
Content-Type: application/json

{
  "recipients": [
    {
      "type": "welcome",
      "email": "user1@example.com",
      "name": "User One"
    },
    {
      "type": "welcome",
      "email": "user2@example.com",
      "name": "User Two"
    }
  ]
}
```

### Get Queue Statistics

```bash
GET http://localhost:3000/queue/stats
```

### List All Jobs

```bash
GET http://localhost:3000/queue/jobs
```

### Get Specific Job

```bash
GET http://localhost:3000/queue/jobs/:jobId
```

### Retry Failed Job

```bash
GET http://localhost:3000/queue/jobs/:jobId/retry
```

## Notification Types

The application supports the following notification types:

1. **welcome** - Welcome email for new users
2. **order_confirmation** - Order confirmation with details
3. **password_reset** - Password reset with token
4. **payment_received** - Payment confirmation

## Project Structure

```
src/
├── notifications/
│   ├── classes/              # Notification classes
│   │   ├── welcome.notification.ts
│   │   ├── order-confirmation.notification.ts
│   │   ├── password-reset.notification.ts
│   │   └── payment-received.notification.ts
│   ├── controllers/          # API controllers
│   │   ├── notifications.controller.ts
│   │   └── queue.controller.ts
│   ├── dto/                  # Data transfer objects
│   │   ├── send-notification.dto.ts
│   │   └── notification-response.dto.ts
│   ├── services/             # Business logic
│   │   ├── notification.service.ts
│   │   └── dashboard.service.ts
│   └── notifications.module.ts
├── app.module.ts
└── main.ts
```

## Adding Custom Notifications

1. Create a new notification class:

```typescript
// src/notifications/classes/custom.notification.ts
import {
  Notification,
  NotificationChannel,
  NotificationPriority,
} from 'townkrier-core';

export class CustomNotification extends Notification {
  constructor(private data: any) {
    super();
    this.priority = NotificationPriority.NORMAL;
  }

  via(): NotificationChannel[] {
    return [NotificationChannel.EMAIL];
  }

  toEmail() {
    return {
      subject: 'Custom Notification',
      html: '<p>Your custom HTML content</p>',
      text: 'Your custom text content',
    };
  }
}
```

2. Add the notification type to the DTO:

```typescript
export enum NotificationType {
  CUSTOM = 'custom',
  // ... other types
}
```

3. Handle it in the service:

```typescript
private createNotification(dto: SendNotificationDto): Notification {
  switch (dto.type) {
    case NotificationType.CUSTOM:
      return new CustomNotification(dto.data);
    // ... other cases
  }
}
```

## Adding More Channels

To add SMS or Push notifications:

1. Install the channel package:

```bash
pnpm add townkrier-termii  # For SMS
pnpm add townkrier-fcm     # For Push
```

2. Update the service configuration:

```typescript
// In notification.service.ts
channels: [
  {
    name: 'email-resend',
    enabled: true,
    priority: 10,
    config: {
      /* ... */
    },
  },
  {
    name: 'sms-termii',
    enabled: true,
    priority: 5,
    config: {
      apiKey: this.configService.get('TERMII_API_KEY'),
      senderId: this.configService.get('TERMII_SENDER_ID'),
    },
  },
];
```

3. Register the factory:

```typescript
import { createTermiiChannel } from 'townkrier-termii';

this.notificationManager.registerFactory('sms-termii', createTermiiChannel);
```

4. Add `toSms()` method to your notification classes:

```typescript
toSms() {
  return {
    text: 'Your SMS message here',
  };
}
```

## Dashboard Features

The TownKrier dashboard provides:

- 📊 Real-time queue statistics
- 📋 Job list with filtering
- 🔄 Retry failed jobs
- 📝 View job details and logs
- 📈 Success/failure metrics
- ⏱️ Job duration tracking

Access it at: http://localhost:4000/townkrier/dashboard

## Testing

```bash
# Unit tests
pnpm run test

# E2E tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a real Redis instance for BullMQ (if using BullMQ adapter)
3. Configure proper database for storage (if using database adapter)
4. Enable dashboard authentication
5. Set up proper logging and monitoring
6. Use environment-specific configuration

## Learn More

- [TownKrier Documentation](../../README.md)
- [NestJS Documentation](https://docs.nestjs.com)
- [Swagger Documentation](http://localhost:3000/api) (when running)

## License

MIT

  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ pnpm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
