import {
  Notification,
  NotificationChannel,
  NotificationPriority,
} from '@townkrier/core';

/**
 * Password reset notification
 */
export class PasswordResetNotification extends Notification {
  constructor(
    private resetToken: string,
    private userName: string,
    private expiresInMinutes: number = 60,
  ) {
    super();
    this.priority = NotificationPriority.URGENT;
  }

  via(): NotificationChannel[] {
    return [NotificationChannel.EMAIL];
  }

  toEmail() {
    const resetLink = `https://yourapp.com/reset-password?token=${this.resetToken}`;

    return {
      subject: '🔐 Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #FF6B6B; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">🔐 Password Reset</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333;">Hi ${this.userName},</p>
            <p style="color: #666;">
              We received a request to reset your password. Click the button below to create a new password:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="background: #FF6B6B; color: white; padding: 15px 40px; 
                        text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            <div style="background: #FFF3CD; border-left: 4px solid #FFC107; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #856404;">
                ⚠️ This link will expire in ${this.expiresInMinutes} minutes. 
                If you didn't request this, please ignore this email.
              </p>
            </div>
            <p style="color: #999; font-size: 12px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetLink}" style="color: #667eea; word-break: break-all;">${resetLink}</a>
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              For security reasons, we recommend changing your password regularly and never sharing it with anyone.
            </p>
          </div>
        </div>
      `,
      text: `Hi ${this.userName}, we received a request to reset your password. 
      Click this link to reset: ${resetLink} 
      This link expires in ${this.expiresInMinutes} minutes. 
      If you didn't request this, please ignore this email.`,
    };
  }
}
