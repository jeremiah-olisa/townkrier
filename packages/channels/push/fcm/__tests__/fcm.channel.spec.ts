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

  it('should create channel using factory', () => {
    const channelFromFactory = createFcmChannel(config);
    expect(channelFromFactory).toBeInstanceOf(FcmChannel);
  });
});
