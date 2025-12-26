import {
  Notification,
  TownkrierFactory,
  NotificationRecipient,
  SmsContent,
  SmsRecipient,
} from '@townkrier/core';
import { createTermiiChannel } from '@townkrier/termii';

// Define a concrete Notification class
class DemoSmsNotification extends Notification {
  constructor(private readonly message: string) {
    super();
  }

  via(): string[] {
    return ['Termii'];
  }

  toSms(): SmsContent {
    return {
      text: this.message,
    };
  }
}

async function run() {
  const apiKey = process.env.TERMII_API_KEY;
  const senderId = process.env.TERMII_SENDER_ID || 'Townkrier';

  if (!apiKey) {
    console.warn('Please set TERMII_API_KEY environment variable to run this playground');
    console.warn('Skipping execution...');
    return;
  }

  // initialize
  const channel = createTermiiChannel({
    apiKey,
    from: senderId,
    debug: true,
  });

  // Use TownkrierFactory to create the manager
  const manager = TownkrierFactory.create({
    channels: [channel],
  });

  console.log('--- Sending Single SMS via Manager ---');
  try {
    // NotificationRecipient structure is keyed by channel or generic
    // For simple usage, we can pass an object that conforms if the manager can map it,
    // but better to match the expected type.
    const recipient: NotificationRecipient = {
      sms: {
        phone: process.env.TEST_PHONE_NUMBER || '2340000000000',
      },
    };

    const notification = new DemoSmsNotification('Hello from Townkrier Termii Channel!');

    const result = await manager.send(notification, recipient);
    console.log('Single SMS Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Single SMS Error:', error);
  }

  console.log('\n--- Sending Bulk SMS (Direct Channel Usage) ---');
  try {
    // For bulk, we're calling the channel directly to test the specific implementation
    // The channel expects SmsRecipient[], which is { phone, name? }
    const recipients: SmsRecipient[] = [
      { phone: process.env.TEST_PHONE_NUMBER || '2340000000000' },
      { phone: process.env.TEST_PHONE_NUMBER_2 || '2340000000001' },
    ];

    const message = 'Hello Bulk World from Townkrier!';

    // Calling channel directly to test internal logic
    // We need to construct a valid SendSmsRequest
    const result = await channel.sendSms({
      to: recipients,
      message: message,
      text: message, // 'text' alias mandated by interface
    });

    console.log('Bulk SMS Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Bulk SMS Error:', error);
  }
}

run();
