import {
  Notification,
  NotificationChannel,
  NotificationPriority,
} from 'townkrier-core';

/**
 * Welcome notification sent to new users
 */
export class WelcomeNotification extends Notification {
  constructor(
    private userName: string,
    private userEmail: string,
    private appName: string = 'TownKrier App',
  ) {
    super();
    this.priority = NotificationPriority.HIGH;
  }

  via(): NotificationChannel[] {
    return [NotificationChannel.EMAIL];
  }

  toEmail() {
    return {
      subject: `Welcome to ${this.appName}, ${this.userName}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px;">Welcome to ${this.appName}! 🎉</h1>
          </div>
          <div style="background: #f7f7f7; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 18px; color: #333;">Hi ${this.userName},</p>
            <p style="color: #666; line-height: 1.6;">
              We're thrilled to have you on board! You've just joined a community of amazing users 
              who are making the most out of our platform.
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #667eea; margin-top: 0;">Here's what you can do next:</h2>
              <ul style="color: #666; line-height: 1.8;">
                <li>✅ Complete your profile</li>
                <li>🔍 Explore our features</li>
                <li>🤝 Connect with other users</li>
                <li>📚 Check out our documentation</li>
              </ul>
            </div>
            <p style="color: #666;">
              If you have any questions, feel free to reach out to our support team. 
              We're here to help!
            </p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://yourapp.com/getting-started" 
                 style="background: #667eea; color: white; padding: 15px 30px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                Get Started
              </a>
            </div>
            <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center;">
              Best regards,<br>
              The ${this.appName} Team
            </p>
          </div>
        </div>
      `,
      text: `Welcome to ${this.appName}, ${this.userName}! We're thrilled to have you on board. 
      Start exploring now and make the most out of our platform. If you need help, our support team is here for you.`,
    };
  }
}
