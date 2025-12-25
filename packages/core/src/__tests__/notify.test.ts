import { NotificationManager } from '../core/notification-manager';
import { Notification } from '../core/notification';
import { Notifiable } from '../core/notifiable';
import { notify } from '../core/notifiable/utils';
import { NotificationChannel } from '../types';
import { NotificationRecipient } from '../interfaces';

// Mock Notification class
class TestNotification extends Notification {
  via(): NotificationChannel[] {
    return [NotificationChannel.EMAIL, NotificationChannel.SMS];
  }

  toEmail() {
    return {
      subject: 'Test',
      html: '<p>Test</p>',
      text: 'Test',
    };
  }

  toSms() {
    return {
      text: 'Test SMS',
    };
  }
}

// Mock Notifiable user
class TestUser extends Notifiable {
  constructor(
    public email: string,
    public phone?: string,
  ) {
    super();
  }

  routeNotificationFor(channel: NotificationChannel): string | undefined {
    switch (channel) {
      case NotificationChannel.EMAIL:
        return this.email;
      case NotificationChannel.SMS:
        return this.phone;
      default:
        return undefined;
    }
  }

  getNotificationName(): string {
    return 'Test User';
  }
}

describe('notify helper function', () => {
  let manager: NotificationManager;
  let mockSend: jest.SpyInstance;

  beforeEach(() => {
    manager = new NotificationManager({
      defaultChannel: 'test-channel',
      channels: [],
    });

    // Mock the send method
    mockSend = jest.spyOn(manager, 'send').mockResolvedValue(
      new Map([
        [NotificationChannel.EMAIL, { success: true }],
        [NotificationChannel.SMS, { success: true }],
      ]),
    );
  });

  afterEach(() => {
    mockSend.mockRestore();
  });

  it('should convert Notifiable to NotificationRecipient and call manager.send', async () => {
    const user = new TestUser('test@example.com', '+1234567890');
    const notification = new TestNotification();

    await notify(user, notification, manager);

    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend).toHaveBeenCalledWith(
      notification,
      expect.objectContaining({
        [NotificationChannel.EMAIL]: 'test@example.com',
        [NotificationChannel.SMS]: '+1234567890',
      }),
    );
  });

  it('should only include channels that have routing info', async () => {
    // User without phone number
    const user = new TestUser('test@example.com');
    const notification = new TestNotification();

    await notify(user, notification, manager);

    const recipientArg = mockSend.mock.calls[0][1] as NotificationRecipient;

    expect(recipientArg[NotificationChannel.EMAIL]).toBe('test@example.com');
    expect(recipientArg[NotificationChannel.SMS]).toBeUndefined();
  });

  it('should return the result from manager.send', async () => {
    const user = new TestUser('test@example.com', '+1234567890');
    const notification = new TestNotification();

    const expectedResult = new Map([
      [NotificationChannel.EMAIL, { success: true, id: '123' }],
      [NotificationChannel.SMS, { success: true, id: '456' }],
    ]);

    mockSend.mockResolvedValue(expectedResult);

    const result = await notify(user, notification, manager);

    expect(result).toBe(expectedResult);
  });

  it('should handle null routing info gracefully', async () => {
    class UserWithNullRouting extends Notifiable {
      routeNotificationFor(): null {
        return null;
      }
    }

    const user = new UserWithNullRouting();
    const notification = new TestNotification();

    await notify(user, notification, manager);

    const recipientArg = mockSend.mock.calls[0][1] as NotificationRecipient;

    // Should not include channels with null routing info
    expect(Object.keys(recipientArg)).toHaveLength(0);
  });

  it('should handle undefined routing info gracefully', async () => {
    class UserWithUndefinedRouting extends Notifiable {
      routeNotificationFor(): undefined {
        return undefined;
      }
    }

    const user = new UserWithUndefinedRouting();
    const notification = new TestNotification();

    await notify(user, notification, manager);

    const recipientArg = mockSend.mock.calls[0][1] as NotificationRecipient;

    // Should not include channels with undefined routing info
    expect(Object.keys(recipientArg)).toHaveLength(0);
  });

  it('should propagate errors from manager.send', async () => {
    const user = new TestUser('test@example.com', '+1234567890');
    const notification = new TestNotification();
    const error = new Error('Send failed');

    mockSend.mockRejectedValue(error);

    await expect(notify(user, notification, manager)).rejects.toThrow('Send failed');
  });

  it('should work with complex routing info (arrays, objects)', async () => {
    class UserWithComplexRouting extends Notifiable {
      routeNotificationFor(channel: NotificationChannel): string | string[] | object {
        if (channel === NotificationChannel.EMAIL) {
          return ['email1@example.com', 'email2@example.com'];
        }
        return { deviceToken: 'abc123' };
      }
    }

    const user = new UserWithComplexRouting();
    const notification = new TestNotification();

    await notify(user, notification, manager);

    const recipientArg = mockSend.mock.calls[0][1] as NotificationRecipient;

    expect(recipientArg[NotificationChannel.EMAIL]).toEqual([
      'email1@example.com',
      'email2@example.com',
    ]);
    expect(recipientArg[NotificationChannel.SMS]).toEqual({ deviceToken: 'abc123' });
  });
});
