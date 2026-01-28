/**
 * Example: Multiple Adapters with Fallback Configuration
 *
 * This example demonstrates how to configure multiple adapters for a single channel
 * with automatic fallback support. When the primary adapter fails, the system
 * automatically tries the next adapter in priority order.
 */

import {
  NotificationManager,
  Notification,
  NotificationChannel,
  NotificationPriority,
} from 'townkrier-core';

import { createResendChannel } from 'townkrier-resend';

// ============================================================================
// Scenario: Email channel with multiple adapters
// ============================================================================

/**
 * In this configuration:
 * - Primary: Resend (priority 10) - Fast, modern API
 * - Fallback: SMTP (priority 5) - Traditional, reliable
 *
 * If Resend fails for any reason (API down, rate limit, etc.),
 * the system will automatically fallback to SMTP.
 */

const notificationManager = new NotificationManager({
  defaultChannel: 'email',
  enableFallback: true, // IMPORTANT: Enable fallback for adapter switching
  channels: [
    {
      name: 'email',
      enabled: true,
      adapters: [
        // Primary adapter: Resend
        {
          name: 'resend',
          enabled: true,
          priority: 10, // Highest priority - tried first
          config: {
            apiKey: process.env.RESEND_API_KEY || 'your-resend-api-key',
            from: process.env.RESEND_FROM_EMAIL || 'notifications@yourapp.com',
            fromName: process.env.RESEND_FROM_NAME || 'Your App',
            debug: process.env.NODE_ENV === 'development',
          },
        },
        // Fallback adapter: SMTP (example - you'd need to implement this)
        // {
        //   name: 'smtp',
        //   enabled: true,
        //   priority: 5, // Lower priority - used if resend fails
        //   config: {
        //     host: process.env.SMTP_HOST,
        //     port: parseInt(process.env.SMTP_PORT || '587'),
        //     secure: false,
        //     auth: {
        //       user: process.env.SMTP_USER,
        //       pass: process.env.SMTP_PASS,
        //     },
        //     from: process.env.SMTP_FROM || 'notifications@yourapp.com',
        //   },
        // },
      ],
    },
  ],
});

// Register the adapter factories
// Each adapter needs to be registered with its corresponding factory function
notificationManager.registerFactory('resend', createResendChannel);
// notificationManager.registerFactory('smtp', createSmtpChannel); // If you have SMTP adapter

// ============================================================================
// Example Notification
// ============================================================================

class WelcomeEmailNotification extends Notification {
  constructor(
    private userName: string,
    private activationLink: string,
  ) {
    super();
    this.priority = NotificationPriority.HIGH;
  }

  via() {
    return [NotificationChannel.EMAIL];
  }

  toEmail() {
    return {
      subject: `Welcome to Our Platform, ${this.userName}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Welcome ${this.userName}!</h1>
          <p>Thank you for joining our platform. We're excited to have you on board!</p>
          <p>Please click the button below to activate your account:</p>
          <a href="${this.activationLink}" 
             style="display: inline-block; padding: 12px 24px; background-color: #007bff; 
                    color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">
            Activate Account
          </a>
          <p>If you didn't create this account, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This email was sent by Your App. Please do not reply to this email.
          </p>
        </div>
      `,
      text: `
        Welcome ${this.userName}!
        
        Thank you for joining our platform. We're excited to have you on board!
        
        Please click the link below to activate your account:
        ${this.activationLink}
        
        If you didn't create this account, please ignore this email.
      `,
    };
  }
}

// ============================================================================
// Sending the Notification
// ============================================================================

async function sendWelcomeEmail() {
  try {
    const notification = new WelcomeEmailNotification(
      'John Doe',
      'https://yourapp.com/activate?token=abc123',
    );

    // Send to a single user
    const response = await notificationManager.send(notification, {
      [NotificationChannel.EMAIL]: {
        email: 'john.doe@example.com',
        name: 'John Doe',
      },
    });

    console.log('✅ Welcome email sent successfully!');
    console.log('Response:', response);

    // The system will automatically:
    // 1. Try to send via Resend (priority 10)
    // 2. If Resend fails, automatically try SMTP (priority 5)
    // 3. Return success if any adapter succeeds
    // 4. Throw error only if all adapters fail
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    // This only happens if ALL configured adapters fail
  }
}

// ============================================================================
// Advanced Example: Multiple Channels with Multiple Adapters Each
// ============================================================================

const advancedManager = new NotificationManager({
  defaultChannel: 'email',
  enableFallback: true,
  channels: [
    // Email channel with fallback
    {
      name: 'email',
      enabled: true,
      adapters: [
        {
          name: 'resend',
          enabled: true,
          priority: 10,
          config: {
            apiKey: process.env.RESEND_API_KEY,
            from: 'notifications@yourapp.com',
          },
        },
        // You can add more email adapters here
        // {
        //   name: 'smtp',
        //   enabled: true,
        //   priority: 5,
        //   config: { /* smtp config */ },
        // },
      ],
    },

    // SMS channel with fallback
    {
      name: 'sms',
      enabled: true,
      adapters: [
        {
          name: 'termii',
          enabled: true,
          priority: 10,
          config: {
            apiKey: process.env.TERMII_API_KEY,
            senderId: 'YourApp',
          },
        },
        // You can add more SMS adapters here
        // {
        //   name: 'twilio',
        //   enabled: true,
        //   priority: 5,
        //   config: { /* twilio config */ },
        // },
      ],
    },
  ],
});

// ============================================================================
// Benefits of This Approach
// ============================================================================

/**
 * 1. Reliability: If one service goes down, your notifications still work
 * 2. Cost Optimization: Use cheaper fallback for non-critical notifications
 * 3. Rate Limiting: Automatically switch when hitting rate limits
 * 4. Geographic Distribution: Primary in one region, fallback in another
 * 5. Testing: Easy to test different providers without changing code
 * 6. Gradual Migration: Slowly move traffic from one provider to another
 */

// Export for use
export { notificationManager, sendWelcomeEmail, advancedManager };
