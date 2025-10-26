# @townkrier/termii

Termii SMS adapter for the TownKrier notification system.

## Features

- 📱 SMS notifications via Termii API
- 🌍 Support for multiple countries and regions
- 🔄 Automatic retry with exponential backoff
- 📝 Message templates and personalization
- 🔍 Delivery status tracking
- 🛡️ Error handling and validation

## Installation

```bash
npm install @townkrier/termii @townkrier/core
# or
pnpm add @townkrier/termii @townkrier/core
```

## Quick Start

```typescript
import { NotificationManager, NotificationChannel } from '@townkrier/core';
import { createTermiiChannel } from '@townkrier/termii';

// Configure the manager with Termii channel
const manager = new NotificationManager({
  defaultChannel: 'sms-termii',
  channels: [
    {
      name: 'sms-termii',
      enabled: true,
      config: {
        apiKey: process.env.TERMII_API_KEY,
        senderId: 'YourApp', // Your registered sender ID
        channel: 'generic', // or 'dnd', 'whatsapp'
      },
    },
  ],
});

// Register the Termii channel factory
manager.registerFactory('sms-termii', createTermiiChannel);

// Create a notification
class WelcomeSmsNotification extends Notification {
  constructor(private userName: string) {
    super();
  }

  via() {
    return [NotificationChannel.SMS];
  }

  toSms() {
    return {
      to: '+1234567890',
      message: `Welcome ${this.userName}! Thank you for joining our service.`,
    };
  }
}

// Send the notification
const notification = new WelcomeSmsNotification('John');
const recipient = {
  [NotificationChannel.SMS]: {
    phone: '+1234567890',
  },
};

await manager.send(notification, recipient);
```

## Configuration

### TermiiConfig

```typescript
interface TermiiConfig {
  apiKey: string; // Required: Your Termii API key
  senderId: string; // Required: Your registered sender ID (max 11 chars)
  channel?: string; // Optional: Message channel (default: 'generic')
  timeout?: number; // Optional: Request timeout in ms (default: 30000)
  debug?: boolean; // Optional: Enable debug logging (default: false)
}
```

### Channel Types

Termii supports different message channels:

- `generic` - Standard SMS (default, most reliable)
- `dnd` - For numbers on DND (Do Not Disturb)
- `whatsapp` - For WhatsApp Business messages

```typescript
{
  channel: 'generic', // Change based on your needs
}
```

## Advanced Usage

### With Personalization

```typescript
class OrderConfirmationNotification extends Notification {
  constructor(
    private orderNumber: string,
    private totalAmount: string,
    private estimatedDelivery: string,
  ) {
    super();
  }

  via() {
    return [NotificationChannel.SMS];
  }

  toSms() {
    return {
      to: '+1234567890',
      message: `Order #${this.orderNumber} confirmed! Total: ${this.totalAmount}. Estimated delivery: ${this.estimatedDelivery}`,
    };
  }
}
```

### Multi-Channel with Fallback

```typescript
class CriticalAlertNotification extends Notification {
  via() {
    // Try SMS first, fallback to email if SMS fails
    return [NotificationChannel.SMS, NotificationChannel.EMAIL];
  }

  toSms() {
    return {
      to: '+1234567890',
      message: 'Critical Alert: Your account requires immediate attention.',
    };
  }

  toEmail() {
    return {
      subject: 'Critical Alert',
      html: '<h1>Critical Alert</h1><p>Your account requires immediate attention.</p>',
    };
  }
}
```

### International Numbers

```typescript
// Always use E.164 format for international numbers
{
  to: '+44712345678',  // UK
  to: '+12125551234',  // USA
  to: '+234812345678', // Nigeria
  message: 'Your message here',
}
```

## Getting Your API Key

1. Sign up at [termii.com](https://termii.com)
2. Navigate to your Dashboard
3. Go to API Settings
4. Copy your API Key
5. Register a Sender ID (this may require verification)

### Sender ID Requirements

- Maximum 11 characters
- Alphanumeric only
- Must be approved by Termii
- Some countries require pre-registration

## Error Handling

The adapter includes comprehensive error handling:

```typescript
import { NotificationFailed } from '@townkrier/core';

// Listen for failures
eventDispatcher.on(NotificationFailed, async (event) => {
  console.error('SMS failed:', event.error.message);
  console.error('Failed channel:', event.failedChannel);

  // Implement custom retry logic or alerts
  if (event.error.message.includes('Invalid number')) {
    // Handle invalid phone numbers
  }
});
```

## Message Length

- Standard SMS: 160 characters
- Unicode messages (emojis, etc.): 70 characters
- Messages longer than these limits are split into multiple parts

## Testing

### Development Mode

```typescript
{
  apiKey: process.env.TERMII_API_KEY,
  senderId: 'Test',
  debug: true, // Enable detailed logging
}
```

### Test Numbers

Termii provides test numbers for development. Check their documentation for current test numbers.

## Pricing

Termii charges per SMS sent. Pricing varies by:

- Destination country
- Message type (SMS vs WhatsApp)
- Volume discounts

Check [Termii Pricing](https://termii.com/pricing) for current rates.

## Best Practices

1. **Validate Phone Numbers**: Always validate numbers before sending
2. **Keep Messages Concise**: Stay under 160 characters when possible
3. **Use Sender ID Wisely**: Choose a recognizable sender ID
4. **Handle Errors**: Implement proper error handling and logging
5. **Respect Regulations**: Follow SMS marketing regulations (TCPA, etc.)
6. **Rate Limiting**: Be mindful of rate limits
7. **Store Preferences**: Track user SMS preferences and opt-outs

## Troubleshooting

### "Invalid API Key"

- Verify your API key is correct
- Check if the key has necessary permissions
- Ensure the key hasn't expired

### "Invalid Sender ID"

- Verify sender ID is registered with Termii
- Check sender ID is maximum 11 characters
- Ensure sender ID is approved for your account

### "Insufficient Balance"

- Check your Termii account balance
- Add credits to your account

### "Invalid Phone Number"

- Use E.164 format (+countrycode + number)
- Remove spaces, dashes, or special characters
- Verify the number is valid for the destination country

## Related Packages

- [@townkrier/core](../../core) - Core notification system
- [@townkrier/resend](../../resend) - Email provider
- [@townkrier/fcm](../push/fcm) - Push notifications provider
- [@townkrier/queue](../../queue) - Queue system for background processing
- [@townkrier/dashboard](../../dashboard) - Monitoring dashboard

## Examples

See the [examples directory](../../../../examples) for complete working examples:

- [Complete Example](../../../../examples/complete-example.ts) - Full multi-channel setup
- [SMS Specific Examples](../../../../examples/notifications) - SMS notification examples

## License

MIT

## Support

- [Termii Documentation](https://developers.termii.com)
- [TownKrier Documentation](../../../../README.md)
- [Report Issues](https://github.com/jeremiah-olisa/townkrier/issues)

## Author

Jeremiah Olisa
