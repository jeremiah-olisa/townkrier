import { FcmChannel, createFcmChannel } from '../src/core';
import { FcmConfig } from '../src/types';
import * as admin from 'firebase-admin';

// Mock firebase-admin
jest.mock('firebase-admin', () => {
  const messaging = {
    send: jest.fn(),
    sendEachForMulticast: jest.fn(),
  };

  return {
    credential: {
      cert: jest.fn(),
      applicationDefault: jest.fn(),
    },
    initializeApp: jest.fn(() => ({})),
    messaging: jest.fn(() => messaging),
  };
});

describe('FcmChannel', () => {
  const config: FcmConfig = {
    projectId: 'test-project',
    serviceAccount: {
      projectId: 'test-project',
      clientEmail: 'test@example.com',
      privateKey: 'private-key',
    },
  };

  let channel: FcmChannel;

  beforeEach(() => {
    jest.clearAllMocks();
    channel = new FcmChannel(config);
  });

  it('should be defined', () => {
    expect(channel).toBeDefined();
  });

  it('should initialize firebase admin', () => {
    expect(admin.initializeApp).toHaveBeenCalled();
  });

  it('should send push notification to single token', async () => {
    const messaging = (admin.messaging as jest.Mock)();
    messaging.send.mockResolvedValue('projects/test/messages/123');

    const result = await channel.sendPush({
      to: { deviceToken: 'token-123' },
      title: 'Test',
      body: 'Body',
      message: 'Body', // Required by BaseNotificationRequest
    });

    expect(messaging.send).toHaveBeenCalledWith(
      expect.objectContaining({
        token: 'token-123',
        notification: {
          title: 'Test',
          body: 'Body',
        },
      }),
    );

    expect(result.status).toBe('sent');
    expect(result.messageId).toBe('projects/test/messages/123');
  });

  it('should send push notification with platform specific options', async () => {
    const messaging = (admin.messaging as jest.Mock)();
    messaging.send.mockResolvedValue('projects/test/messages/123');

    const result = await channel.sendPush({
      to: { deviceToken: 'token-123' },
      title: 'Test',
      body: 'Body',
      message: 'Body',
      imageUrl: 'https://example.com/image.png',
      metadata: {
        channelId: 'news',
        ttl: '3600',
        collapseKey: 'updates',
      },
      actionUrl: 'https://example.com/click',
    });

    expect(messaging.send).toHaveBeenCalledWith(
      expect.objectContaining({
        token: 'token-123',
        notification: {
          title: 'Test',
          body: 'Body',
          imageUrl: 'https://example.com/image.png',
        },
        android: expect.objectContaining({
          notification: expect.objectContaining({
            channelId: 'news',
            imageUrl: 'https://example.com/image.png',
            clickAction: 'https://example.com/click',
          }),
          ttl: 3600000,
          collapseKey: 'updates',
        }),
        webpush: expect.objectContaining({
          fcmOptions: {
            link: 'https://example.com/click',
          },
          headers: expect.objectContaining({
            TTL: '3600',
          }),
        }),
        apns: expect.objectContaining({
          headers: expect.objectContaining({
            'apns-collapse-id': 'updates',
          }),
          fcmOptions: {
            imageUrl: 'https://example.com/image.png',
          },
        }),
      }),
    );

    expect(result.status).toBe('sent');
  });

  it('should handle single send error gracefully', async () => {
    const messaging = (admin.messaging as jest.Mock)();
    const error = new Error('Invalid token');
    (error as any).code = 'messaging/registration-token-not-registered';
    messaging.send.mockRejectedValue(error);

    const result = await channel.sendPush({
      to: { deviceToken: 'invalid-token' },
      title: 'Test',
      body: 'Body',
      message: 'Body',
    });

    expect(result.status).toBe('sent'); // It sends "successfully" in terms of method execution, but contains failures
    expect(result.successCount).toBe(0);
    expect(result.failureCount).toBe(1);
    // Based on our implementation, single send failure is caught and returned as a response with failure
  });

  it('should create channel using factory', () => {
    const channelFromFactory = createFcmChannel(config);
    expect(channelFromFactory).toBeInstanceOf(FcmChannel);
  });
});
