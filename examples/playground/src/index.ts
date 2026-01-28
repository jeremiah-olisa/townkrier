import {
  BaseNotificationChannel,
  TownkrierFactory,
  Notification,
  NotificationChannel,
  SendSmsRequest,
  SendSmsResponse,
  NotificationChannelConfig,
  NotificationManager,
} from 'townkrier-core';

// 1. Define Typed Configuration
interface MySmsConfig extends NotificationChannelConfig {
  apiKey: string;
  senderId: string;
}

// 2. Create a Generic Channel (Type Safe!)
class MySmsChannel extends BaseNotificationChannel<MySmsConfig, SendSmsRequest, SendSmsResponse> {
  constructor(config: MySmsConfig) {
    super(config, 'my-sms', NotificationChannel.SMS);
  }

  isReady(): boolean {
    return !!this.config.apiKey;
  }

  async sendTyped(request: SendSmsRequest): Promise<SendSmsResponse> {
    console.log(`📱 [SMS] Sending to ${request.to}: ${request.text}`);
    return {
      success: true,
      messageId: 'sms-' + Date.now(),
      status: 'sent',
      sentAt: new Date(),
    } as any;
  }
}

// 3. Create a CUSTOM Channel (Extensibility Proof!)
// Note: 'slack' is NOT in the core NotificationChannel enum (unless added later, but treated as string here)
interface SlackConfig extends NotificationChannelConfig {
  webhookUrl: string;
}
interface SendSlackRequest {
  channel: string;
  text: string;
}

class SlackChannel extends BaseNotificationChannel<SlackConfig, SendSlackRequest, any> {
  constructor(config: SlackConfig) {
    // We pass a custom string 'slack' as channel type!
    super(config, 'my-slack', 'slack');
  }

  protected validateConfig(): void {
    // Custom validation for webhook
    if (!this.config.webhookUrl) {
      throw new Error('Webhook URL required');
    }
  }

  isReady(): boolean {
    return !!this.config.webhookUrl;
  }

  async sendTyped(request: SendSlackRequest): Promise<any> {
    console.log(`💬 [Slack] Sending to #${request.channel}: ${request.text}`);
    return { success: true };
  }
}

// 4. Define Notification using both channels
class OtpNotification extends Notification {
  constructor(private code: string) {
    super();
  }

  // We return a mix of Enum and string!
  via(): (NotificationChannel | string)[] {
    return [NotificationChannel.SMS, 'slack'];
  }

  toSms() {
    return { text: `Your OTP is: ${this.code}` };
  }

  // Magic method for custom channel 'slack' -> toSlack()
  toSlack() {
    return { channel: 'general', text: `New OTP generated: ${this.code}` };
  }
}

import { NotifiableMixin } from 'townkrier-core';

// 6. Test Mixin
class BaseEntity {
  constructor(public id: string) {}
}

class User extends NotifiableMixin(BaseEntity) {
  constructor(
    id: string,
    public email: string,
    public phone: string,
  ) {
    super(id);
  }

  routeNotificationFor(channel: string) {
    if (channel === 'email') return this.email;
    if (channel === 'sms') return this.phone;
    if (channel === 'slack') return '#general';
    return null;
  }
}

async function main() {
  console.log('🚀 Starting Townkrier Extensibility Playground...');

  const smsChannel = new MySmsChannel({ config: {}, apiKey: '123', senderId: 'TK' });
  const slackChannel = new SlackChannel({ config: {}, webhookUrl: 'https://hooks.slack.com/...' });

  const townkrier = TownkrierFactory.create({
    channels: [smsChannel, slackChannel],
    defaultChannel: 'my-sms',
    enableFallback: true,
  });

  const recipient = {
    id: 'user-1',
    [NotificationChannel.SMS]: '+1234567890',
    // Custom channel routing
    slack: '#general',
  };

  console.log('📨 Sending OTP via SMS and Slack...');
  await townkrier.send(new OtpNotification('998877'), recipient);
  console.log('✅ Done!');

  console.log('🧪 Testing Mixin...');
  const user = new User('u1', 'test@example.com', '+1234567890');

  // Inject manager
  user.setNotificationManager(townkrier); // townkrier is the manager instance

  console.log('📨 Sending via Mixin User...');
  // Ensure townkrier is initialized before this
  await user.notify(new OtpNotification('MIXIN-123'));

  console.log('✅ Mixin Test Done!');
}

main().catch(console.error);
