/* eslint-disable @typescript-eslint/no-explicit-any */
import { NotificationManager } from '../core/notification-manager';
import { Notification } from '../core/notification';
import { NotificationChannel, NotificationStatus } from '../types';
import { INotificationChannel } from '../interfaces/notification-channel.interface';
import { NotificationConfigurationException } from '../exceptions';
import { NotificationRecipient } from '../interfaces';

// Mock email channel that can be configured to fail
class MockEmailChannel implements INotificationChannel {
  private shouldFail: boolean;

  constructor(
    private config: Record<string, any>,
    private name: string = 'mock-email',
    shouldFail: boolean = false,
  ) {
    this.shouldFail = shouldFail;
  }

  getChannelName(): string {
    return this.name;
  }

  getChannelType(): NotificationChannel {
    return NotificationChannel.EMAIL;
  }

  isReady(): boolean {
    return !!this.config.apiKey;
  }

  setShouldFail(fail: boolean): void {
    this.shouldFail = fail;
  }

  async send(_request: any): Promise<any> {
    if (!this.config.apiKey) {
      throw new Error('API key is required');
    }
    if (this.shouldFail) {
      throw new Error(`${this.name} adapter failed`);
    }
    return {
      success: true,
      messageId: `${this.name}-123`,
      status: NotificationStatus.SENT,
    };
  }
}

// Factory functions for different email adapters
function createResendAdapter(config: Record<string, any>): INotificationChannel {
  return new MockEmailChannel(config, 'resend', false);
}

function createSmtpAdapter(config: Record<string, any>): INotificationChannel {
  return new MockEmailChannel(config, 'smtp', false);
}

function createPostmarkAdapter(config: Record<string, any>): INotificationChannel {
  return new MockEmailChannel(config, 'postmark', false);
}

// Test notification class
class TestEmailNotification extends Notification {
  via() {
    return [NotificationChannel.EMAIL];
  }

  toEmail() {
    return {
      subject: 'Test Subject',
      html: '<p>Test content</p>',
      from: { email: 'test@example.com', name: 'Test' },
    };
  }
}

describe('NotificationManager - Adapter Fallback', () => {
  describe('Multiple adapters configuration', () => {
    it('should support multiple adapters for a single channel', () => {
      const manager = new NotificationManager({
        defaultChannel: 'email',
        enableFallback: true,
        channels: [
          {
            name: 'email',
            enabled: true,
            adapters: [
              {
                name: 'resend',
                enabled: true,
                priority: 10,
                config: { apiKey: 'resend-key' },
              },
              {
                name: 'smtp',
                enabled: true,
                priority: 5,
                config: { apiKey: 'smtp-key' },
              },
            ],
          },
        ],
      });

      // Register factories
      manager.registerFactory('resend', createResendAdapter);
      manager.registerFactory('smtp', createSmtpAdapter);

      expect(manager.hasChannel('email-resend')).toBe(true);
      expect(manager.hasChannel('email-smtp')).toBe(true);
    });

    it('should use adapters in priority order', async () => {
      const manager = new NotificationManager({
        defaultChannel: 'email',
        enableFallback: true,
        channels: [
          {
            name: 'email',
            enabled: true,
            adapters: [
              {
                name: 'resend',
                enabled: true,
                priority: 10,
                config: { apiKey: 'resend-key' },
              },
              {
                name: 'smtp',
                enabled: true,
                priority: 5,
                config: { apiKey: 'smtp-key' },
              },
            ],
          },
        ],
      });

      manager.registerFactory('resend', createResendAdapter);
      manager.registerFactory('smtp', createSmtpAdapter);

      const notification = new TestEmailNotification();
      const recipient = {
        [NotificationChannel.EMAIL]: { email: 'test@example.com' },
      } as NotificationRecipient;

      const results = await manager.send(notification, recipient);
      expect(results.size).toBe(1);

      const emailResult = results.get(NotificationChannel.EMAIL) as any;
      expect(emailResult.success).toBe(true);
      expect(emailResult.messageId).toBe('resend-123');
    });

    it('should fallback to second adapter when first fails', async () => {
      const failingResendAdapter = (config: Record<string, any>) => {
        return new MockEmailChannel(config, 'resend', true); // Will fail
      };

      const manager = new NotificationManager({
        defaultChannel: 'email',
        enableFallback: true,
        channels: [
          {
            name: 'email',
            enabled: true,
            adapters: [
              {
                name: 'resend',
                enabled: true,
                priority: 10,
                config: { apiKey: 'resend-key' },
              },
              {
                name: 'smtp',
                enabled: true,
                priority: 5,
                config: { apiKey: 'smtp-key' },
              },
            ],
          },
        ],
      });

      manager.registerFactory('resend', failingResendAdapter);
      manager.registerFactory('smtp', createSmtpAdapter);

      const notification = new TestEmailNotification();
      const recipient = {
        [NotificationChannel.EMAIL]: { email: 'test@example.com' },
      } as NotificationRecipient;

      const results = await manager.send(notification, recipient);
      expect(results.size).toBe(1);

      const emailResult = results.get(NotificationChannel.EMAIL) as any;
      expect(emailResult.success).toBe(true);
      expect(emailResult.messageId).toBe('smtp-123'); // Used fallback
    });

    it('should fallback through all adapters in order', async () => {
      const failingResendAdapter = (config: Record<string, any>) => {
        return new MockEmailChannel(config, 'resend', true);
      };
      const failingSmtpAdapter = (config: Record<string, any>) => {
        return new MockEmailChannel(config, 'smtp', true);
      };

      const manager = new NotificationManager({
        defaultChannel: 'email',
        enableFallback: true,
        channels: [
          {
            name: 'email',
            enabled: true,
            adapters: [
              {
                name: 'resend',
                enabled: true,
                priority: 10,
                config: { apiKey: 'resend-key' },
              },
              {
                name: 'smtp',
                enabled: true,
                priority: 5,
                config: { apiKey: 'smtp-key' },
              },
              {
                name: 'postmark',
                enabled: true,
                priority: 3,
                config: { apiKey: 'postmark-key' },
              },
            ],
          },
        ],
      });

      manager.registerFactory('resend', failingResendAdapter);
      manager.registerFactory('smtp', failingSmtpAdapter);
      manager.registerFactory('postmark', createPostmarkAdapter);

      const notification = new TestEmailNotification();
      const recipient = {
        [NotificationChannel.EMAIL]: { email: 'test@example.com' },
      } as NotificationRecipient;

      const results = await manager.send(notification, recipient);
      expect(results.size).toBe(1);

      const emailResult = results.get(NotificationChannel.EMAIL) as any;
      expect(emailResult.success).toBe(true);
      expect(emailResult.messageId).toBe('postmark-123'); // Used last fallback
    });

    it('should throw error when all adapters fail', async () => {
      const failingAdapter = (config: Record<string, any>) => {
        return new MockEmailChannel(config, 'failing', true);
      };

      const manager = new NotificationManager({
        defaultChannel: 'email',
        enableFallback: false, // Changed to false so errors are thrown
        channels: [
          {
            name: 'email',
            enabled: true,
            adapters: [
              {
                name: 'resend',
                enabled: true,
                priority: 10,
                config: { apiKey: 'resend-key' },
              },
              {
                name: 'smtp',
                enabled: true,
                priority: 5,
                config: { apiKey: 'smtp-key' },
              },
            ],
          },
        ],
      });

      manager.registerFactory('resend', failingAdapter);
      manager.registerFactory('smtp', failingAdapter);

      const notification = new TestEmailNotification();
      const recipient = {
        [NotificationChannel.EMAIL]: { email: 'test@example.com' },
      } as NotificationRecipient;

      await expect(manager.send(notification, recipient)).rejects.toThrow(
        NotificationConfigurationException,
      );
    });

    it('should skip disabled adapters', async () => {
      const manager = new NotificationManager({
        defaultChannel: 'email',
        enableFallback: true,
        channels: [
          {
            name: 'email',
            enabled: true,
            adapters: [
              {
                name: 'resend',
                enabled: false, // Disabled
                priority: 10,
                config: { apiKey: 'resend-key' },
              },
              {
                name: 'smtp',
                enabled: true,
                priority: 5,
                config: { apiKey: 'smtp-key' },
              },
            ],
          },
        ],
      });

      manager.registerFactory('resend', createResendAdapter);
      manager.registerFactory('smtp', createSmtpAdapter);

      const notification = new TestEmailNotification();
      const recipient = {
        [NotificationChannel.EMAIL]: { email: 'test@example.com' },
      } as NotificationRecipient;

      const results = await manager.send(notification, recipient);
      expect(results.size).toBe(1);

      const emailResult = results.get(NotificationChannel.EMAIL) as any;
      expect(emailResult.success).toBe(true);
      expect(emailResult.messageId).toBe('smtp-123'); // Skipped disabled resend
    });
  });

  describe('Legacy configuration support', () => {
    it('should still support legacy single adapter config', async () => {
      const manager = new NotificationManager({
        defaultChannel: 'email-resend',
        enableFallback: false,
        channels: [
          {
            name: 'email-resend',
            enabled: true,
            config: { apiKey: 'resend-key' },
          },
        ],
      });

      manager.registerFactory('email-resend', createResendAdapter);

      const notification = new TestEmailNotification();
      const recipient = {
        [NotificationChannel.EMAIL]: { email: 'test@example.com' },
      } as NotificationRecipient;

      const results = await manager.send(notification, recipient);
      expect(results.size).toBe(1);

      const emailResult = results.get(NotificationChannel.EMAIL) as any;
      expect(emailResult.success).toBe(true);
      expect(emailResult.messageId).toBe('resend-123');
    });

    it('should work with mix of legacy and new config', async () => {
      const manager = new NotificationManager({
        defaultChannel: 'email',
        enableFallback: true,
        channels: [
          {
            name: 'email',
            enabled: true,
            adapters: [
              {
                name: 'resend',
                enabled: true,
                priority: 10,
                config: { apiKey: 'resend-key' },
              },
            ],
          },
          {
            name: 'email-backup',
            enabled: true,
            config: { apiKey: 'backup-key' }, // Legacy config
          },
        ],
      });

      manager.registerFactory('resend', createResendAdapter);
      manager.registerFactory('email-backup', createSmtpAdapter);

      expect(manager.hasChannel('email-resend')).toBe(true);
      expect(manager.hasChannel('email-backup')).toBe(true);
    });
  });

  describe('sendWithAdapterFallback', () => {
    it('should allow direct use of sendWithAdapterFallback', async () => {
      const manager = new NotificationManager({
        defaultChannel: 'email',
        enableFallback: true,
        channels: [
          {
            name: 'email',
            enabled: true,
            adapters: [
              {
                name: 'resend',
                enabled: true,
                priority: 10,
                config: { apiKey: 'resend-key' },
              },
              {
                name: 'smtp',
                enabled: true,
                priority: 5,
                config: { apiKey: 'smtp-key' },
              },
            ],
          },
        ],
      });

      manager.registerFactory('resend', createResendAdapter);
      manager.registerFactory('smtp', createSmtpAdapter);

      const request = {
        to: { email: 'test@example.com' },
        subject: 'Test',
        html: '<p>Test</p>',
        from: { email: 'sender@example.com' },
      };

      const response = await manager.sendWithAdapterFallback('email', request as any);
      expect((response as any).success).toBe(true);
      expect((response as any).messageId).toBe('resend-123');
    });
  });
});
