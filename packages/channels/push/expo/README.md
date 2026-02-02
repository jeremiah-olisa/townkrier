# Townkrier Expo Push Notifications

Expo Push Notifications adapter for the Townkrier notification system.

## Installation

```bash
npm install townkrier-expo expo-server-sdk
# or
pnpm add townkrier-expo expo-server-sdk
# or
yarn add townkrier-expo expo-server-sdk
```

## Usage

```typescript
import { ExpoChannel } from 'townkrier-expo';
import { SendPushRequest } from 'townkrier-core';

// Create an Expo channel
const expoChannel = new ExpoChannel({
  enabled: true,
  accessToken: 'your-expo-access-token', // Optional
});

// Send a push notification
const request: SendPushRequest = {
  to: {
    deviceToken: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
  },
  title: 'Hello!',
  message: 'This is a push notification from Townkrier',
  data: {
    customData: 'value',
  },
  priority: 'high',
};

const response = await expoChannel.sendPush(request);
console.log('Notification sent:', response);
```

## Configuration

The `ExpoConfig` interface extends `NotificationChannelConfig` and accepts:

- `accessToken` (optional): Expo access token for additional features
- `enabled`: Whether the channel is enabled
- `maxRetries` (optional): Maximum number of retries for failed requests
- `retryDelay` (optional): Delay between retries in milliseconds

## Features

- ✅ Send push notifications to Expo apps
- ✅ Send to single or multiple devices
- ✅ Support for Android and iOS specific options
- ✅ Sound, badge, and priority configuration
- ✅ Custom data payloads
- ✅ Batch sending with automatic chunking
- ✅ Receipt validation

## Requirements

- Expo SDK 48+ in your React Native app
- Valid Expo push tokens from devices

## Learn More

- [Expo Push Notifications Documentation](https://docs.expo.dev/push-notifications/overview/)
- [Townkrier Documentation](https://github.com/jeremiah-olisa/townkrier)
