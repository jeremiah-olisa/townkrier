# @townkrier/resend

Resend email adapter for the TownKrier notification system.

## Features

- 📧 Modern email delivery via Resend API
- 🎨 HTML and plain text email support
- 📎 File attachments support
- 🔄 Automatic retry with exponential backoff
- 📊 Delivery tracking and webhooks
- 🎯 Template support
- 🌐 Multiple from addresses
- 🔒 Secure authentication

## Installation

```bash
npm install @townkrier/resend @townkrier/core
# or
pnpm add @townkrier/resend @townkrier/core
```

## Quick Start

```typescript
import { NotificationManager, NotificationChannel } from '@townkrier/core';
import { createResendChannel } from '@townkrier/resend';

// Configure the manager with Resend channel
const manager = new NotificationManager({
  defaultChannel: 'email-resend',
  channels: [
    {
      name: 'email-resend',
      enabled: true,
      config: {
        apiKey: process.env.RESEND_API_KEY,
        from: 'notifications@yourdomain.com',
        fromName: 'Your App',
      },
    },
  ],
});

// Register the Resend channel factory
manager.registerFactory('email-resend', createResendChannel);

// Create a notification
class WelcomeEmailNotification extends Notification {
  constructor(private userName: string) {
    super();
  }

  via() {
    return [NotificationChannel.EMAIL];
  }

  toEmail() {
    return {
      subject: 'Welcome to Our App! 🎉',
      html: `
        <h1>Welcome ${this.userName}!</h1>
        <p>Thanks for joining our service.</p>
      `,
      text: `Welcome ${this.userName}! Thanks for joining our service.`,
    };
  }
}

// Send the notification
const notification = new WelcomeEmailNotification('John');
const recipient = {
  [NotificationChannel.EMAIL]: {
    email: 'john@example.com',
    name: 'John Doe',
  },
};

await manager.send(notification, recipient);
```

## Configuration

### ResendConfig

```typescript
interface ResendConfig {
  apiKey: string; // Required: Your Resend API key
  from?: string; // Optional: Default from email address
  fromName?: string; // Optional: Default from name
  timeout?: number; // Optional: Request timeout in ms (default: 30000)
  debug?: boolean; // Optional: Enable debug logging (default: false)
}
```

## Getting Your API Key

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain in the dashboard
3. Navigate to API Keys section
4. Create a new API key
5. Store it securely in your environment variables

### Domain Verification

Before sending emails, you must verify your domain:

1. Go to Resend Dashboard → Domains
2. Add your domain
3. Add the provided DNS records (SPF, DKIM)
4. Wait for verification (usually a few minutes)

## Advanced Usage

### Rich HTML Emails

```typescript
class OrderConfirmationNotification extends Notification {
  constructor(
    private orderNumber: string,
    private items: Array<{ name: string; price: number }>,
    private total: number,
  ) {
    super();
  }

  via() {
    return [NotificationChannel.EMAIL];
  }

  toEmail() {
    const itemsList = this.items.map((item) => `<li>${item.name} - $${item.price}</li>`).join('');

    return {
      subject: `Order Confirmation #${this.orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Order Confirmed! ✅</h1>
          <p>Thank you for your order. Here's what you ordered:</p>
          <ul style="list-style: none; padding: 0;">
            ${itemsList}
          </ul>
          <hr />
          <p style="font-size: 18px; font-weight: bold;">
            Total: $${this.total.toFixed(2)}
          </p>
          <a href="https://yourapp.com/orders/${this.orderNumber}" 
             style="display: inline-block; padding: 12px 24px; background: #007bff; 
                    color: white; text-decoration: none; border-radius: 4px;">
            View Order Details
          </a>
        </div>
      `,
      text: `Order Confirmation #${this.orderNumber}\n\nThank you for your order!\n\nTotal: $${this.total.toFixed(2)}`,
    };
  }
}
```

### Email with Attachments

```typescript
import { readFileSync } from 'fs';

class InvoiceNotification extends Notification {
  constructor(
    private invoiceNumber: string,
    private pdfPath: string,
  ) {
    super();
  }

  via() {
    return [NotificationChannel.EMAIL];
  }

  toEmail() {
    return {
      subject: `Invoice #${this.invoiceNumber}`,
      html: '<p>Please find your invoice attached.</p>',
      attachments: [
        {
          filename: `invoice-${this.invoiceNumber}.pdf`,
          content: readFileSync(this.pdfPath),
        },
      ],
    };
  }
}
```

### Custom From Address per Email

```typescript
class CustomerSupportNotification extends Notification {
  via() {
    return [NotificationChannel.EMAIL];
  }

  toEmail() {
    return {
      from: {
        email: 'support@yourdomain.com',
        name: 'Customer Support',
      },
      subject: 'Re: Your Support Ticket',
      html: '<p>Thank you for contacting support...</p>',
    };
  }
}
```

### Reply-To and CC/BCC

```typescript
class NewsletterNotification extends Notification {
  via() {
    return [NotificationChannel.EMAIL];
  }

  toEmail() {
    return {
      subject: 'Monthly Newsletter',
      html: '<h1>This month in tech...</h1>',
      replyTo: 'newsletter@yourdomain.com',
      cc: ['archive@yourdomain.com'],
      bcc: ['analytics@yourdomain.com'],
    };
  }
}
```

### Email Templates

```typescript
class PasswordResetNotification extends Notification {
  constructor(
    private userName: string,
    private resetToken: string,
    private resetUrl: string,
  ) {
    super();
  }

  via() {
    return [NotificationChannel.EMAIL];
  }

  toEmail() {
    return {
      subject: 'Reset Your Password',
      html: this.getTemplate(),
      text: this.getPlainText(),
    };
  }

  private getTemplate(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background: #007bff; 
            color: white; 
            text-decoration: none; 
            border-radius: 4px; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Password Reset Request</h2>
          <p>Hi ${this.userName},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <a href="${this.resetUrl}" class="button">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      </body>
      </html>
    `;
  }

  private getPlainText(): string {
    return `
      Password Reset Request
      
      Hi ${this.userName},
      
      We received a request to reset your password. 
      Click the link below to create a new password:
      
      ${this.resetUrl}
      
      This link will expire in 1 hour.
      
      If you didn't request this, please ignore this email.
    `;
  }
}
```

### Multi-Recipient Emails

```typescript
class TeamUpdateNotification extends Notification {
  constructor(private teamMembers: string[]) {
    super();
  }

  via() {
    return [NotificationChannel.EMAIL];
  }

  toEmail() {
    return {
      to: this.teamMembers.map((email) => ({ email })),
      subject: 'Team Update',
      html: '<h1>Important team update...</h1>',
    };
  }
}
```

## Error Handling

```typescript
import { NotificationFailed } from '@townkrier/core';

eventDispatcher.on(NotificationFailed, async (event) => {
  console.error('Email failed:', event.error.message);

  // Handle specific errors
  if (event.error.message.includes('Invalid email')) {
    // Log invalid email for review
    await logInvalidEmail(recipient);
  } else if (event.error.message.includes('Rate limit')) {
    // Implement rate limiting
    await delayNextEmail();
  }
});
```

### Common Errors

- `Invalid API key` - Check your Resend API key
- `Domain not verified` - Verify your sending domain
- `Invalid email address` - Validate recipient email
- `Rate limit exceeded` - Implement rate limiting

## Testing

### Development Mode

```typescript
{
  apiKey: process.env.RESEND_API_KEY,
  from: 'dev@yourdomain.com',
  debug: true, // Enable detailed logging
}
```

### Test Emails

Use test email addresses for development:

```typescript
const testRecipient = {
  [NotificationChannel.EMAIL]: {
    email: 'delivered@resend.dev', // Always succeeds
  },
};
```

Resend provides special test addresses:

- `delivered@resend.dev` - Always delivers successfully
- `bounced@resend.dev` - Simulates a bounce
- `complained@resend.dev` - Simulates a spam complaint

## Best Practices

1. **Domain Verification**: Always verify your sending domain
2. **Plain Text Fallback**: Include both HTML and plain text versions
3. **Responsive Design**: Use responsive HTML templates
4. **Unsubscribe Links**: Include unsubscribe options in bulk emails
5. **Validate Emails**: Validate recipient emails before sending
6. **Rate Limiting**: Respect Resend's rate limits
7. **Error Handling**: Implement proper error handling and logging
8. **Bounce Handling**: Monitor bounces and remove invalid addresses
9. **Spam Compliance**: Follow CAN-SPAM and GDPR guidelines
10. **Test Before Launch**: Test emails on different clients and devices

## Webhooks

Set up webhooks in Resend Dashboard to track:

- Email delivered
- Email opened
- Email clicked
- Email bounced
- Email complained

```typescript
// Example webhook handler (Express)
app.post('/webhooks/resend', (req, res) => {
  const { type, data } = req.body;

  switch (type) {
    case 'email.delivered':
      // Update delivery status
      break;
    case 'email.bounced':
      // Handle bounce, mark email as invalid
      break;
    case 'email.complained':
      // Handle spam complaint, unsubscribe user
      break;
  }

  res.status(200).send('OK');
});
```

## Pricing

Resend offers:

- **Free Tier**: 100 emails/day, 1 domain
- **Paid Plans**: Starting at $20/month for 50,000 emails

Check [Resend Pricing](https://resend.com/pricing) for current rates.

## Troubleshooting

### "Domain not verified"

- Add DNS records provided by Resend
- Wait for DNS propagation (up to 48 hours)
- Check DNS records with `dig` or online tools

### "Invalid API key"

- Verify API key is correct (no extra spaces)
- Check if key has necessary permissions
- Regenerate key if needed

### Emails going to spam

- Verify SPF and DKIM records
- Warm up your domain gradually
- Avoid spam trigger words
- Include unsubscribe link
- Use a consistent from address

### Slow delivery

- Check Resend status page
- Verify your rate limits
- Consider implementing queues for bulk sends

## Rate Limits

Resend rate limits vary by plan:

- Free: Limited to bursts
- Paid: Higher limits based on plan

Implement queuing for bulk emails:

```typescript
import { QueueManager } from '@townkrier/queue';

const queueManager = new QueueManager(queueAdapter, manager);

// Queue emails for gradual delivery
for (const user of users) {
  await queueManager.enqueue(notification, {
    [NotificationChannel.EMAIL]: {
      email: user.email,
      name: user.name,
    },
  });
}
```

## Related Packages

- [@townkrier/core](../core) - Core notification system
- [@townkrier/termii](../channels/sms/termii) - SMS provider
- [@townkrier/fcm](../channels/push/fcm) - Push notifications provider
- [@townkrier/queue](../queue) - Queue system for background processing
- [@townkrier/dashboard](../dashboard) - Monitoring dashboard

## Examples

See the [examples directory](../../examples) for complete working examples:

- [Complete Example](../../examples/complete-example.ts) - Full multi-channel setup
- [Email Examples](../../examples/notifications) - Email-specific examples

## Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend API Reference](https://resend.com/docs/api-reference)
- [TownKrier Documentation](../../README.md)

## License

MIT

## Support

- [Resend Support](https://resend.com/support)
- [Report Issues](https://github.com/jeremiah-olisa/townkrier/issues)

## Author

Jeremiah Olisa
