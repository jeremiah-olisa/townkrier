import 'dotenv/config';
import {
  NotificationManager,
  NotificationChannel,
  NotificationRecipient,
  Logger,
  Notification,
  EmailContent,
  ITemplateRenderer,
  NotificationChannelConfig,
} from 'townkrier-core';

// 1. Define a simple Template Notification
class WelcomeTemplateNotification extends Notification {
  constructor(private name: string) {
    super();
  }

  via(): NotificationChannel[] {
    return [NotificationChannel.EMAIL];
  }

  toEmail(): EmailContent {
    return {
      subject: 'Welcome to Townkrier',
      template: 'welcome-email', // Template identifier
      context: {
        // Data for the template
        name: this.name,
        company: 'Townkrier Inc.',
      },
      from: { email: 'hello@townkrier.dev', name: 'Townkrier Team' },
    };
  }
}

// 2. Implement a simple Custom Renderer (e.g., could be Swap, EJS, React, etc.)
class SimpleStringRenderer implements ITemplateRenderer {
  private templates: Record<string, string> = {
    'welcome-email': '<h1>Hello, {{name}}!</h1><p>Welcome to {{company}}.</p>',
  };

  async render(template: string, context: Record<string, unknown>): Promise<string> {
    Logger.log(`[Renderer] Rendering template '${template}' with context:`, context);

    let content = this.templates[template];
    if (!content) {
      throw new Error(`Template '${template}' not found.`);
    }

    // Simple string replacement for demo
    Object.keys(context).forEach((key) => {
      const value = String(context[key]);
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    return content;
  }
}

// 3. Mock Email Channel (for demo purposes, to avoid needing real API keys)
const createMockEmailChannel = (config: NotificationChannelConfig) => ({
  send: async (request: any) => {
    Logger.log('[MockEmail] Sending email...');
    Logger.log(`[MockEmail] Subject: ${request.subject}`);
    Logger.log(`[MockEmail] HTML Body: ${request.html}`); // Check if HTML is rendered
    return {
      status: 'sent',
      messageId: 'mock-email-123',
      sentAt: new Date(),
    };
  },
  getChannelName: () => 'mock-email',
  getChannelType: () => 'email',
  isReady: () => true,
});

async function run() {
  Logger.log('--- Template Rendering Playground ---');

  // 4. Setup Manager with Renderer
  const renderer = new SimpleStringRenderer();
  const manager = new NotificationManager({
    channels: [],
    renderer: renderer, // Register the renderer
  });

  // 5. Register Mock Channel
  manager.registerChannel(NotificationChannel.EMAIL, createMockEmailChannel({}));

  // 6. Send Notification
  const notification = new WelcomeTemplateNotification('Jeremiah');
  const recipient: NotificationRecipient = {
    [NotificationChannel.EMAIL]: { email: 'test@example.com' },
  };

  Logger.log('Sending notification with template...');
  try {
    await manager.send(notification, recipient);
    Logger.log('Successfully sent!');
  } catch (error) {
    Logger.error('Failed to send:', error);
  }
}

run();
