/**
 * Complete example of setting up and using the Townkrier notification system
 *
 * This example demonstrates:
 * 1. Setting up the NotificationManager with multiple channels
 * 2. Creating custom notification classes
 * 3. Implementing the Notifiable interface
 * 4. Listening to notification events
 * 5. Sending notifications with fallback support
 */

import {
  NotificationManager,
  Notification,
  NotificationChannel,
  NotificationPriority,
  Notifiable,
  getEventDispatcher,
  NotificationSending,
  NotificationSent,
  NotificationFailed,
} from '@townkrier/core';

import { createResendChannel } from '@townkrier/resend';
import { createTermiiChannel } from '@townkrier/termii';
import { createFcmChannel } from '@townkrier/fcm';

// ============================================================================
// 1. Setup Event Listeners (Optional but recommended)
// ============================================================================

const eventDispatcher = getEventDispatcher();

eventDispatcher.on(NotificationSending, async (event) => {
  console.log('📤 Sending notification via channels:', event.channels);
  // Here you could:
  // - Log to database
  // - Send to analytics
  // - Update metrics
});

eventDispatcher.on(NotificationSent, async (event) => {
  console.log('✅ Notification sent successfully!');
  console.log('   Channels used:', event.channels);
  console.log('   Responses:', event.responses.size);
  // Here you could:
  // - Update user notification preferences
  // - Track successful deliveries
  // - Send confirmation to admin
});

eventDispatcher.on(NotificationFailed, async (event) => {
  console.error('❌ Notification failed!');
  console.error('   Error:', event.error.message);
  console.error('   Failed channel:', event.failedChannel);
  // Here you could:
  // - Log error to monitoring service (Sentry, etc.)
  // - Alert administrators
  // - Retry with different channel
  // - Update system health metrics
});

// ============================================================================
// 2. Initialize Notification Manager
// ============================================================================

const notificationManager = new NotificationManager(
  {
    defaultChannel: 'email-resend',
    enableFallback: true, // Enable fallback to other channels on failure
    channels: [
      // Email Channel - Resend
      {
        name: 'email-resend',
        enabled: true,
        priority: 10, // Highest priority
        config: {
          apiKey: process.env.RESEND_API_KEY || 'your-resend-api-key',
          from: process.env.RESEND_FROM_EMAIL || 'notifications@yourapp.com',
          fromName: process.env.RESEND_FROM_NAME || 'Your App',
          debug: process.env.NODE_ENV === 'development',
        },
      },
      // SMS Channel - Termii
      {
        name: 'sms-termii',
        enabled: true,
        priority: 5,
        config: {
          apiKey: process.env.TERMII_API_KEY || 'your-termii-api-key',
          senderId: process.env.TERMII_SENDER_ID || 'YourApp',
          channel: 'generic',
          debug: process.env.NODE_ENV === 'development',
        },
      },
      // Push Channel - Firebase Cloud Messaging
      {
        name: 'push-fcm',
        enabled: true,
        priority: 3,
        config: {
          serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
            : undefined,
          serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
          projectId: process.env.FIREBASE_PROJECT_ID || 'your-project-id',
          debug: process.env.NODE_ENV === 'development',
        },
      },
    ],
  },
  eventDispatcher,
);

// Register channel factories
notificationManager.registerFactory('email-resend', createResendChannel);
notificationManager.registerFactory('sms-termii', createTermiiChannel);
notificationManager.registerFactory('push-fcm', createFcmChannel);

// ============================================================================
// 3. Create Custom Notification Classes
// ============================================================================

/**
 * Welcome notification sent to new users
 */
class WelcomeNotification extends Notification {
  constructor(
    private userName: string,
    private appName: string = 'YourApp',
  ) {
    super();
    this.priority = NotificationPriority.HIGH;
  }

  via(): NotificationChannel[] {
    return [NotificationChannel.EMAIL, NotificationChannel.SMS];
  }

  toEmail() {
    return {
      subject: `Welcome to ${this.appName}, ${this.userName}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome to ${this.appName}!</h1>
          <p>Hi ${this.userName},</p>
          <p>We're thrilled to have you on board. Here's what you can do next:</p>
          <ul>
            <li>Complete your profile</li>
            <li>Explore our features</li>
            <li>Connect with others</li>
          </ul>
          <p>If you have any questions, feel free to reach out to our support team.</p>
          <p>Best regards,<br>The ${this.appName} Team</p>
        </div>
      `,
      text: `Welcome to ${this.appName}, ${this.userName}! We're thrilled to have you on board.`,
    };
  }

  toSms() {
    return {
      text: `Welcome to ${this.appName}, ${this.userName}! Thanks for joining us. Start exploring now!`,
    };
  }
}

/**
 * Order confirmation notification
 */
class OrderConfirmationNotification extends Notification {
  constructor(
    private orderId: string,
    private orderTotal: number,
    private itemCount: number,
  ) {
    super();
    this.priority = NotificationPriority.HIGH;
  }

  via(): NotificationChannel[] {
    return [NotificationChannel.EMAIL, NotificationChannel.PUSH];
  }

  toEmail() {
    return {
      subject: `Order Confirmation - #${this.orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Order Confirmed!</h2>
          <p>Your order has been confirmed and is being processed.</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 5px;">
            <p><strong>Order ID:</strong> ${this.orderId}</p>
            <p><strong>Items:</strong> ${this.itemCount}</p>
            <p><strong>Total:</strong> $${this.orderTotal.toFixed(2)}</p>
          </div>
          <p>We'll notify you when your order ships!</p>
        </div>
      `,
      text: `Order #${this.orderId} confirmed! Total: $${this.orderTotal}. We'll notify you when it ships.`,
    };
  }

  toPush() {
    return {
      title: 'Order Confirmed!',
      body: `Your order #${this.orderId} has been confirmed. Total: $${this.orderTotal.toFixed(2)}`,
      icon: 'order-icon.png',
      sound: 'notification.mp3',
      data: {
        orderId: this.orderId,
        type: 'order_confirmation',
      },
    };
  }
}

/**
 * Password reset notification
 */
class PasswordResetNotification extends Notification {
  constructor(
    private resetToken: string,
    private expiresInMinutes: number = 30,
  ) {
    super();
    this.priority = NotificationPriority.URGENT;
  }

  via(): NotificationChannel[] {
    return [NotificationChannel.EMAIL];
  }

  toEmail() {
    const resetUrl = `https://yourapp.com/reset-password?token=${this.resetToken}`;

    return {
      subject: 'Reset Your Password',
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password. Click the button below to proceed:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: #007bff; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p><strong>This link will expire in ${this.expiresInMinutes} minutes.</strong></p>
          <p>If you didn't request this, please ignore this email.</p>
          <p style="color: #666; font-size: 12px;">
            If the button doesn't work, copy and paste this URL: ${resetUrl}
          </p>
        </div>
      `,
      text: `Reset your password: ${resetUrl} (expires in ${this.expiresInMinutes} minutes)`,
    };
  }
}

// ============================================================================
// 4. Implement Notifiable Interface on User Model
// ============================================================================

class User implements Notifiable {
  constructor(
    public id: string,
    public name: string,
    public email: string,
    public phone?: string,
    public fcmTokens?: string[],
  ) {}

  routeNotificationFor(channel: NotificationChannel): unknown {
    switch (channel) {
      case NotificationChannel.EMAIL:
        return { email: this.email, name: this.name };

      case NotificationChannel.SMS:
        return this.phone ? { phone: this.phone } : null;

      case NotificationChannel.PUSH:
        return this.fcmTokens?.map((token) => ({
          deviceToken: token,
          userId: this.id,
        }));

      case NotificationChannel.IN_APP:
        return { userId: this.id, email: this.email };

      default:
        return null;
    }
  }

  getNotificationName(): string {
    return this.name;
  }
}

// ============================================================================
// 5. Send Notifications
// ============================================================================

async function sendWelcomeEmail(user: User) {
  console.log('\n📧 Sending welcome email...');

  const notification = new WelcomeNotification(user.name);
  const recipient = buildRecipientFromUser(user, notification.via());

  try {
    const responses = await notificationManager.send(notification, recipient);
    console.log('✅ Welcome email sent!');
    return responses;
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    throw error;
  }
}

async function sendOrderConfirmation(user: User, orderId: string, total: number, items: number) {
  console.log('\n📦 Sending order confirmation...');

  const notification = new OrderConfirmationNotification(orderId, total, items);
  const recipient = buildRecipientFromUser(user, notification.via());

  try {
    const responses = await notificationManager.send(notification, recipient);
    console.log('✅ Order confirmation sent!');
    return responses;
  } catch (error) {
    console.error('❌ Failed to send order confirmation:', error);
    throw error;
  }
}

async function sendPasswordReset(user: User, token: string) {
  console.log('\n🔒 Sending password reset...');

  const notification = new PasswordResetNotification(token, 30);
  const recipient = buildRecipientFromUser(user, notification.via());

  try {
    const responses = await notificationManager.send(notification, recipient);
    console.log('✅ Password reset email sent!');
    return responses;
  } catch (error) {
    console.error('❌ Failed to send password reset:', error);
    throw error;
  }
}

// ============================================================================
// 6. Helper Functions
// ============================================================================

function buildRecipientFromUser(
  user: User,
  channels: NotificationChannel[],
): Record<NotificationChannel, unknown> {
  const recipient: Partial<Record<NotificationChannel, unknown>> = {};

  for (const channel of channels) {
    const route = user.routeNotificationFor(channel);
    if (route) {
      recipient[channel] = route;
    }
  }

  return recipient as Record<NotificationChannel, unknown>;
}

// ============================================================================
// 7. Usage Examples
// ============================================================================

async function main() {
  console.log('🚀 Townkrier Notification System - Complete Example\n');

  // Create a sample user
  const user = new User('123', 'John Doe', 'john.doe@example.com', '+1234567890', [
    'fcm-device-token-123',
  ]);

  console.log('👤 User:', user.name);
  console.log('📧 Email:', user.email);
  console.log('📱 Phone:', user.phone);

  // Example 1: Send welcome email
  await sendWelcomeEmail(user);

  // Example 2: Send order confirmation
  await sendOrderConfirmation(user, 'ORD-12345', 99.99, 3);

  // Example 3: Send password reset
  const resetToken = 'random-secure-token-' + Date.now();
  await sendPasswordReset(user, resetToken);

  console.log('\n✨ All examples completed!\n');
}

// ============================================================================
// 8. Export for use in other modules
// ============================================================================

export {
  notificationManager,
  WelcomeNotification,
  OrderConfirmationNotification,
  PasswordResetNotification,
  User,
  sendWelcomeEmail,
  sendOrderConfirmation,
  sendPasswordReset,
};

// Run examples if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}
