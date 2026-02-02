# Townkrier SSE (Server-Sent Events)

Server-Sent Events adapter for real-time in-app notifications in the Townkrier notification system.

## Installation

```bash
npm install townkrier-sse
# or
pnpm add townkrier-sse
# or
yarn add townkrier-sse
```

## Usage

### Creating an SSE Channel

```typescript
import { SseChannel } from 'townkrier-sse';
import { SendInAppRequest } from 'townkrier-core';

// Create an SSE channel
const sseChannel = new SseChannel({
  enabled: true,
  heartbeatInterval: 30000, // Send heartbeat every 30 seconds
  maxConnections: 1000, // Maximum concurrent connections per user
});

// Send a notification
const request: SendInAppRequest = {
  to: { userId: 'user123' },
  title: 'New Message',
  message: 'You have a new message!',
  type: 'info',
  data: {
    messageId: '12345',
    sender: 'John Doe',
  },
};

const response = await sseChannel.sendInApp(request);
console.log('Notification sent:', response);
```

### Setting up SSE Endpoint (Express Example)

```typescript
import express from 'express';
import { SseChannel } from 'townkrier-sse';

const app = express();
const sseChannel = new SseChannel({ enabled: true });

// SSE endpoint for clients to connect
app.get('/api/notifications/stream', (req, res) => {
  const userId = req.user.id; // Get from auth middleware

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for nginx

  // Register the connection
  sseChannel.addConnection(userId, res);

  // Handle client disconnect
  req.on('close', () => {
    sseChannel.removeConnection(userId, res);
  });
});

app.listen(3000);
```

### Setting up SSE Endpoint (NestJS Example)

```typescript
import { Controller, Get, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { SseChannel } from 'townkrier-sse';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly sseChannel: SseChannel) {}

  @Get('stream')
  stream(@Req() req, @Res() res: Response) {
    const userId = req.user.sub;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // Register connection
    this.sseChannel.addConnection(userId, res);

    // Handle disconnect
    req.on('close', () => {
      this.sseChannel.removeConnection(userId, res);
    });
  }
}
```

### Client-Side Implementation

```typescript
// React/React Native example
import { useEffect, useState } from 'react';

function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const eventSource = new EventSource(`/api/notifications/stream`);

    eventSource.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      setNotifications((prev) => [notification, ...prev]);
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [userId]);

  return notifications;
}
```

## Configuration

The `SseConfig` interface extends `NotificationChannelConfig` and accepts:

- `enabled`: Whether the channel is enabled
- `heartbeatInterval` (optional): Interval in milliseconds to send heartbeat comments (default: 30000)
- `maxConnections` (optional): Maximum concurrent connections per user (default: 10)
- `eventType` (optional): Custom event type name (default: 'notification')

## Features

- ✅ Real-time notification delivery via Server-Sent Events
- ✅ Automatic connection management
- ✅ Heartbeat/keep-alive mechanism
- ✅ Multiple connections per user support
- ✅ Graceful connection cleanup
- ✅ Custom event types
- ✅ Works with Express, NestJS, and other Node.js frameworks

## Connection Management

The SSE channel maintains active connections and automatically:

- Sends heartbeat comments to keep connections alive
- Cleans up disconnected clients
- Handles multiple connections per user
- Broadcasts to all active connections for a user

## Requirements

- Node.js 14+
- HTTP/1.1 or HTTP/2 server
- Client support for EventSource API (all modern browsers)

## Learn More

- [Server-Sent Events Specification](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [MDN: Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [Townkrier Documentation](https://github.com/jeremiah-olisa/townkrier)
