import {
  NotificationManager,
  IEmailChannel,
  SendEmailRequest,
  SendEmailResponse,
  Notification,
  NotificationChannel,
} from '@townkrier/core';

// 1. Define a Mock Channel
class MockEmailChannel implements IEmailChannel {
  async send(request: SendEmailRequest): Promise<SendEmailResponse> {
    console.log('📧 [MockEmailChannel] Sending email:', request);
    return {
      success: true,
      messageId: 'mock-id-' + Date.now(),
      status: 'sent',
      sentAt: new Date(),
    } as any;
  }

  async sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
    return this.send(request);
  }

  getChannelName(): string {
    return 'email-mock';
  }

  getChannelType(): NotificationChannel {
    return NotificationChannel.EMAIL;
  }

  isReady(): boolean {
    return true;
  }
}

// 2. Define a Notification
class WelcomeNotification extends Notification {
  constructor(private userName: string) {
    super();
  }

  via(): NotificationChannel[] {
    return [NotificationChannel.EMAIL];
  }

  toEmail() {
    return {
      subject: 'Welcome to Townkrier!',
      text: `Hello ${this.userName}, welcome to our platform!`,
      html: `<p>Hello <strong>${this.userName}</strong>, welcome to our platform!</p>`,
    };
  }
}

// 3. Execution
async function main() {
  console.log('🚀 Starting Townkrier Playground...');

  // Setup Manager
  const manager = new NotificationManager();

  // Register Channel
  manager.registerChannel('email', new MockEmailChannel());

  // Create User/Recipient
  const user = {
    id: 'user-1',
    [NotificationChannel.EMAIL]: 'test@example.com',
  };

  // Send Notification
  console.log('📨 Sending notification...');
  const response = await manager.send(new WelcomeNotification('Developer'), user);

  console.log('✅ Result:', response);
}

main().catch(console.error);
