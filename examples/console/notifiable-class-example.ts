/**
 * Example demonstrating the enhanced Notifiable class with dependency injection
 *
 * This shows how to:
 * 1. Inject NotificationManager into a User class
 * 2. Use notify() without passing manager explicitly
 * 3. Override the injected manager when needed
 * 4. Use helper methods for channel checking
 */

import {
  NotificationManager,
  Notification,
  NotificationChannel,
  NotificationPriority,
  Notifiable,
} from 'townkrier-core';

import { createResendChannel } from 'townkrier-resend';

// ============================================================================
// 1. Create a User class extending Notifiable
// ============================================================================

class User extends Notifiable {
  constructor(
    public id: string,
    public email: string,
    public phone?: string,
    public name?: string,
    public deviceToken?: string,
    manager?: NotificationManager,
  ) {
    super(manager); // Inject manager into base class
  }

  /**
   * Route notifications for different channels
   */
  routeNotificationFor(channel: NotificationChannel): string | undefined {
    switch (channel) {
      case NotificationChannel.EMAIL:
        return this.email;
      case NotificationChannel.SMS:
        return this.phone;
      case NotificationChannel.PUSH:
        return this.deviceToken;
      default:
        return this.email;
    }
  }

  /**
   * Get the name for notifications
   */
  getNotificationName(): string {
    return this.name || 'User';
  }
}

// ============================================================================
// 2. Create custom notifications
// ============================================================================

class WelcomeNotification extends Notification {
  constructor(private userName: string) {
    super();
    this.priority = NotificationPriority.HIGH;
  }

  via(): NotificationChannel[] {
    return [NotificationChannel.EMAIL];
  }

  toEmail() {
    return {
      subject: 'Welcome to Our Platform!',
      html: `<h1>Welcome ${this.userName}!</h1><p>We're excited to have you here.</p>`,
      text: `Welcome ${this.userName}! We're excited to have you here.`,
    };
  }
}

class SecurityAlertNotification extends Notification {
  constructor(
    private userName: string,
    private alertMessage: string,
  ) {
    super();
    this.priority = NotificationPriority.CRITICAL;
  }

  via(): NotificationChannel[] {
    // Try both email and SMS for critical alerts
    return [NotificationChannel.EMAIL, NotificationChannel.SMS];
  }

  toEmail() {
    return {
      subject: '🔒 Security Alert',
      html: `<h1>Security Alert</h1><p>Hi ${this.userName},</p><p>${this.alertMessage}</p>`,
      text: `Security Alert - Hi ${this.userName}, ${this.alertMessage}`,
    };
  }

  toSms() {
    return {
      message: `Security Alert: ${this.alertMessage}`,
    };
  }
}

// ============================================================================
// 3. Setup and demonstrate different usage patterns
// ============================================================================

async function main() {
  // Setup NotificationManager
  const manager = new NotificationManager({
    defaultChannel: 'email-resend',
    channels: [
      {
        name: 'email-resend',
        enabled: true,
        config: {
          apiKey: process.env.RESEND_API_KEY || 'test-key',
          from: 'noreply@example.com',
          fromName: 'My App',
        },
      },
    ],
  });

  manager.registerFactory('email-resend', createResendChannel);

  console.log('='.repeat(80));
  console.log('Pattern 1: Manager injected via constructor');
  console.log('='.repeat(80));

  // Create user with injected manager
  const user1 = new User(
    '123',
    'john@example.com',
    '+1234567890',
    'John Doe',
    undefined,
    manager, // Inject manager
  );

  // Check available channels
  console.log('Available channels:', user1.getAvailableChannels());
  console.log('Has email?', user1.hasChannelRoute(NotificationChannel.EMAIL));
  console.log('Has SMS?', user1.hasChannelRoute(NotificationChannel.SMS));

  // Send notification without passing manager - uses injected one
  console.log('\n📤 Sending welcome notification (using injected manager)...');
  try {
    await user1.notify(new WelcomeNotification(user1.name!));
    console.log('✅ Notification sent successfully!');
  } catch (error) {
    console.error('❌ Failed:', error);
  }

  console.log('\n' + '='.repeat(80));
  console.log('Pattern 2: Set manager after construction');
  console.log('='.repeat(80));

  // Create user without manager
  const user2 = new User('456', 'jane@example.com', '+0987654321', 'Jane Smith');

  // Set manager later (useful for dependency injection frameworks)
  user2.setNotificationManager(manager);

  console.log('\n📤 Sending security alert (using set manager)...');
  try {
    // Check if user can receive via multiple channels
    const requiredChannels = [NotificationChannel.EMAIL, NotificationChannel.SMS];
    if (user2.hasAllChannels(requiredChannels)) {
      console.log('✓ User has all required channels');
      await user2.notify(new SecurityAlertNotification(user2.name!, 'Unusual login detected'));
      console.log('✅ Security alert sent successfully!');
    } else {
      console.log('✗ User missing some channels, sending anyway...');
      await user2.notify(new SecurityAlertNotification(user2.name!, 'Unusual login detected'));
    }
  } catch (error) {
    console.error('❌ Failed:', error);
  }

  console.log('\n' + '='.repeat(80));
  console.log('Pattern 3: Override injected manager');
  console.log('='.repeat(80));

  // Create another manager (e.g., for testing or special cases)
  const testManager = new NotificationManager({
    defaultChannel: 'email-resend',
    channels: [
      {
        name: 'email-resend',
        enabled: true,
        config: {
          apiKey: 'test-key',
          from: 'test@example.com',
          fromName: 'Test App',
        },
      },
    ],
  });

  testManager.registerFactory('email-resend', createResendChannel);

  console.log('\n📤 Sending notification with explicit manager (overrides injected)...');
  try {
    // Pass manager explicitly - overrides the injected one
    await user1.notify(new WelcomeNotification(user1.name!), testManager);
    console.log('✅ Notification sent with override manager!');
  } catch (error) {
    console.error('❌ Failed:', error);
  }

  console.log('\n' + '='.repeat(80));
  console.log('Pattern 4: No manager - will throw error');
  console.log('='.repeat(80));

  const user3 = new User('789', 'bob@example.com', undefined, 'Bob Johnson');

  console.log('\n📤 Trying to send without manager...');
  try {
    await user3.notify(new WelcomeNotification(user3.name!));
  } catch (error) {
    console.error('❌ Expected error:', (error as Error).message);
  }

  console.log('\n' + '='.repeat(80));
  console.log('Pattern 5: Using helper methods');
  console.log('='.repeat(80));

  const user4 = new User('999', 'alice@example.com', '+1111111111', 'Alice Wonder');

  console.log('\nUser capabilities:');
  console.log('- Identifier:', user4.getIdentifier());
  console.log('- Can receive via EMAIL?', user4.canReceiveVia(NotificationChannel.EMAIL));
  console.log('- Can receive via SMS?', user4.canReceiveVia(NotificationChannel.SMS));
  console.log('- Can receive via PUSH?', user4.canReceiveVia(NotificationChannel.PUSH));

  const multiChannelNotification = [NotificationChannel.EMAIL, NotificationChannel.SMS];
  console.log('- Has any of [EMAIL, SMS]?', user4.hasAnyChannel(multiChannelNotification));
  console.log('- Has all of [EMAIL, SMS]?', user4.hasAllChannels(multiChannelNotification));

  // Build recipient object
  const recipient = user4.toRecipient(multiChannelNotification);
  console.log('- Recipient object:', recipient);
}

// ============================================================================
// Run example
// ============================================================================

if (require.main === module) {
  console.log('='.repeat(80));
  console.log('Enhanced Notifiable Class Example');
  console.log('='.repeat(80));

  main()
    .then(() => {
      console.log('\n✨ Example completed!');
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}
