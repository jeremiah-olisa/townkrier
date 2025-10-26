/* eslint-disable @typescript-eslint/no-explicit-any */
import { NotificationManager } from '../core/notification-manager';
import { Notification } from '../core/notification';
import { NotificationChannel } from '../types';
import { INotificationChannel } from '../interfaces/notification-channel.interface';
import { NotificationConfigurationException } from '../exceptions';
import { NotificationRecipient } from '../interfaces';

// Mock channel for testing
class MockEmailChannel implements INotificationChannel {
  constructor(private config: Record<string, any>) {}

  getChannelName(): string {
    return 'mock-email';
  }

  getChannelType(): NotificationChannel {
    return NotificationChannel.EMAIL;
  }

  isReady(): boolean {
    return !!this.config.apiKey;
  }

  async send(_request: any): Promise<any> {
    if (!this.config.apiKey) {
      throw new Error('API key is required');
    }
    return { success: true, messageId: 'test-123' };
  }
}

function createMockEmailChannel(config: Record<string, any>): INotificationChannel {
  return new MockEmailChannel(config);
}

// Test notification class
class TestNotification extends Notification {
  via() {
    return [NotificationChannel.EMAIL];
  }

  toEmail() {
    return {
      subject: 'Test Subject',
      html: '<p>Test content</p>',
    };
  }
}

describe('NotificationManager', () => {
  describe('constructor', () => {
    it('should create manager without configuration', () => {
      const manager = new NotificationManager();
      expect(manager).toBeInstanceOf(NotificationManager);
    });

    it('should create manager with configuration', () => {
      const manager = new NotificationManager({
        defaultChannel: 'email-mock',
        enableFallback: true,
        channels: [
          {
            name: 'email-mock',
            enabled: true,
            priority: 10,
            config: {
              apiKey: 'test-key',
            },
          },
        ],
      });
      expect(manager).toBeInstanceOf(NotificationManager);
    });
  });

  describe('registerFactory', () => {
    it('should register a channel factory', () => {
      const manager = new NotificationManager();
      const result = manager.registerFactory('email-mock', createMockEmailChannel);
      expect(result).toBe(manager); // Fluent interface
    });

    it('should initialize channel when config is available', () => {
      const manager = new NotificationManager({
        defaultChannel: 'email-mock',
        channels: [
          {
            name: 'email-mock',
            enabled: true,
            config: {
              apiKey: 'test-key',
            },
          },
        ],
      });

      manager.registerFactory('email-mock', createMockEmailChannel);
      expect(manager.hasChannel('email-mock')).toBe(true);
    });

    it('should not initialize disabled channels', () => {
      const manager = new NotificationManager({
        channels: [
          {
            name: 'email-mock',
            enabled: false,
            config: {
              apiKey: 'test-key',
            },
          },
        ],
      });

      manager.registerFactory('email-mock', createMockEmailChannel);
      expect(manager.hasChannel('email-mock')).toBe(false);
    });
  });

  describe('registerChannel', () => {
    it('should register a channel instance directly', () => {
      const manager = new NotificationManager();
      const channel = new MockEmailChannel({ apiKey: 'test-key' });
      const result = manager.registerChannel('email-mock', channel);

      expect(result).toBe(manager);
      expect(manager.hasChannel('email-mock')).toBe(true);
    });
  });

  describe('getChannel', () => {
    it('should get a registered channel', () => {
      const manager = new NotificationManager();
      const channel = new MockEmailChannel({ apiKey: 'test-key' });
      manager.registerChannel('email-mock', channel);

      const retrievedChannel = manager.getChannel('email-mock');
      expect(retrievedChannel).toBe(channel);
    });

    it('should throw error for unregistered channel', () => {
      const manager = new NotificationManager();

      expect(() => manager.getChannel('non-existent')).toThrow(NotificationConfigurationException);
    });

    it('should throw error for channel that is not ready', () => {
      const manager = new NotificationManager();
      const channel = new MockEmailChannel({}); // No API key
      manager.registerChannel('email-mock', channel);

      expect(() => manager.getChannel('email-mock')).toThrow(NotificationConfigurationException);
    });

    it('should be case-insensitive', () => {
      const manager = new NotificationManager();
      const channel = new MockEmailChannel({ apiKey: 'test-key' });
      manager.registerChannel('Email-Mock', channel);

      expect(manager.getChannel('email-mock')).toBe(channel);
      expect(manager.getChannel('EMAIL-MOCK')).toBe(channel);
    });
  });

  describe('hasChannel', () => {
    it('should return true for existing channel', () => {
      const manager = new NotificationManager();
      const channel = new MockEmailChannel({ apiKey: 'test-key' });
      manager.registerChannel('email-mock', channel);

      expect(manager.hasChannel('email-mock')).toBe(true);
    });

    it('should return false for non-existing channel', () => {
      const manager = new NotificationManager();
      expect(manager.hasChannel('non-existent')).toBe(false);
    });
  });

  describe('getAvailableChannels', () => {
    it('should return all registered channel names', () => {
      const manager = new NotificationManager();
      const channel1 = new MockEmailChannel({ apiKey: 'test-key' });
      const channel2 = new MockEmailChannel({ apiKey: 'test-key' });

      manager.registerChannel('email-mock', channel1);
      manager.registerChannel('email-backup', channel2);

      const channels = manager.getAvailableChannels();
      expect(channels).toContain('email-mock');
      expect(channels).toContain('email-backup');
      expect(channels.length).toBe(2);
    });

    it('should return empty array when no channels registered', () => {
      const manager = new NotificationManager();
      expect(manager.getAvailableChannels()).toEqual([]);
    });
  });

  describe('getReadyChannels', () => {
    it('should return only ready channels', () => {
      const manager = new NotificationManager();
      const readyChannel = new MockEmailChannel({ apiKey: 'test-key' });
      const notReadyChannel = new MockEmailChannel({});

      manager.registerChannel('email-ready', readyChannel);
      manager.registerChannel('email-not-ready', notReadyChannel);

      const readyChannels = manager.getReadyChannels();
      expect(readyChannels).toContain('email-ready');
      expect(readyChannels).not.toContain('email-not-ready');
      expect(readyChannels.length).toBe(1);
    });
  });

  describe('setDefaultChannel', () => {
    it('should set the default channel', () => {
      const manager = new NotificationManager();
      const channel = new MockEmailChannel({ apiKey: 'test-key' });
      manager.registerChannel('email-mock', channel);

      const result = manager.setDefaultChannel('email-mock');
      expect(result).toBe(manager);
      expect(manager.getDefaultChannel()).toBe(channel);
    });

    it('should throw error when setting non-existent default channel', () => {
      const manager = new NotificationManager();

      expect(() => manager.setDefaultChannel('non-existent')).toThrow(
        NotificationConfigurationException,
      );
    });
  });

  describe('send', () => {
    it('should send notification successfully', async () => {
      const manager = new NotificationManager({
        defaultChannel: 'email-mock',
        channels: [
          {
            name: 'email-mock',
            enabled: true,
            config: {
              apiKey: 'test-key',
            },
          },
        ],
      });

      manager.registerFactory('email-mock', createMockEmailChannel);

      const notification = new TestNotification();
      const recipient = {
        [NotificationChannel.EMAIL]: { email: 'test@example.com' },
      } as Partial<NotificationRecipient> as NotificationRecipient;

      const results = await manager.send(notification, recipient);
      expect(results.size).toBe(1);
      expect(results.has(NotificationChannel.EMAIL)).toBe(true);
    });

    it('should throw error when no channels are configured', async () => {
      const manager = new NotificationManager();
      const notification = new TestNotification();
      const recipient = {
        [NotificationChannel.EMAIL]: { email: 'test@example.com' },
      } as Partial<NotificationRecipient> as NotificationRecipient;

      await expect(manager.send(notification, recipient)).rejects.toThrow(
        NotificationConfigurationException,
      );
    });
  });

  describe('removeChannel', () => {
    it('should remove a channel', () => {
      const manager = new NotificationManager();
      const channel = new MockEmailChannel({ apiKey: 'test-key' });
      manager.registerChannel('email-mock', channel);

      expect(manager.hasChannel('email-mock')).toBe(true);
      manager.removeChannel('email-mock');
      expect(manager.hasChannel('email-mock')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all channels', () => {
      const manager = new NotificationManager();
      const channel1 = new MockEmailChannel({ apiKey: 'test-key' });
      const channel2 = new MockEmailChannel({ apiKey: 'test-key' });

      manager.registerChannel('email-mock', channel1);
      manager.registerChannel('email-backup', channel2);

      expect(manager.getAvailableChannels().length).toBe(2);
      manager.clear();
      expect(manager.getAvailableChannels().length).toBe(0);
    });
  });
});
