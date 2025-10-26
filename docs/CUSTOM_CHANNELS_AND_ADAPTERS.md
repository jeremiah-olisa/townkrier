# Custom Channel and Adapter Guide

This guide explains how to create custom channels and adapters for the Townkrier notification system, enabling you to extend the system with your own notification providers (e.g., VoIP, social media, custom SMS providers, etc.).

## Table of Contents

1. [Understanding the Architecture](#understanding-the-architecture)
2. [Creating a Custom Channel](#creating-a-custom-channel)
3. [Creating Multiple Adapters for a Channel](#creating-multiple-adapters-for-a-channel)
4. [Implementing Adapter Fallback](#implementing-adapter-fallback)
5. [Complete Examples](#complete-examples)

## Understanding the Architecture

Townkrier uses a flexible architecture that separates **channels** (notification types like email, SMS, VoIP) from **adapters** (specific service providers).

```
Channel (e.g., "email")
  ├── Adapter 1 (e.g., "resend") - Priority 10
  ├── Adapter 2 (e.g., "smtp") - Priority 5
  └── Adapter 3 (e.g., "postmark") - Priority 3
```

When sending a notification, the system will:

1. Try the highest priority adapter first
2. If it fails, automatically fallback to the next adapter
3. Continue until a successful send or all adapters fail

## Creating a Custom Channel

Let's create a VoIP channel for making voice calls.

### Step 1: Define the Channel Interface

```typescript
import { NotificationChannel } from '@townkrier/core';

// Add your custom channel type to the NotificationChannel enum
// This would typically be done by extending the core types
export enum CustomNotificationChannel {
  VOIP = 'voip',
}
```

### Step 2: Create Request and Response Interfaces

```typescript
// voip-request.interface.ts
export interface SendVoipRequest {
  to: string | string[]; // Phone number(s)
  message: string;
  voice?: 'male' | 'female';
  language?: string;
  reference?: string;
  metadata?: Record<string, unknown>;
}

// voip-response.interface.ts
export interface SendVoipResponse {
  success: boolean;
  callId?: string;
  status: 'initiated' | 'completed' | 'failed';
  duration?: number;
  error?: {
    code: string;
    message: string;
  };
}
```

### Step 3: Create the Base Channel Class

```typescript
// voip.channel.ts
import { BaseNotificationChannel } from '@townkrier/core';
import { SendVoipRequest, SendVoipResponse } from './interfaces';

export abstract class VoipChannel extends BaseNotificationChannel {
  constructor(config: any, channelName: string) {
    super(config, channelName, CustomNotificationChannel.VOIP as any);
  }

  abstract sendVoip(request: SendVoipRequest): Promise<SendVoipResponse>;

  async send(notification: any): Promise<any> {
    if (this.isVoipRequest(notification)) {
      return this.sendVoip(notification);
    }
    throw new Error(`${this.channelName} only supports VoIP notifications`);
  }

  private isVoipRequest(notification: any): notification is SendVoipRequest {
    return 'to' in notification && 'message' in notification;
  }
}
```

### Step 4: Create Specific Adapters

Let's create two adapters: Twilio and Vonage

```typescript
// twilio-voip.adapter.ts
import { VoipChannel } from './voip.channel';
import { SendVoipRequest, SendVoipResponse } from './interfaces';

export interface TwilioVoipConfig {
  apiKey: string;
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

export class TwilioVoipChannel extends VoipChannel {
  private config: TwilioVoipConfig;

  constructor(config: TwilioVoipConfig) {
    super(config, 'Twilio VoIP');
    this.config = config;
  }

  async sendVoip(request: SendVoipRequest): Promise<SendVoipResponse> {
    try {
      // Implement Twilio API call here
      const response = await this.callTwilioAPI(request);

      return {
        success: true,
        callId: response.sid,
        status: 'initiated',
      };
    } catch (error) {
      return {
        success: false,
        status: 'failed',
        error: {
          code: 'TWILIO_ERROR',
          message: error.message,
        },
      };
    }
  }

  private async callTwilioAPI(request: SendVoipRequest): Promise<any> {
    // Implementation using Twilio SDK
    // This is a placeholder - use actual Twilio SDK
    console.log('Calling Twilio API with:', request);
    return { sid: 'call-123' };
  }
}

// Factory function
export function createTwilioVoipChannel(config: TwilioVoipConfig): TwilioVoipChannel {
  return new TwilioVoipChannel(config);
}
```

```typescript
// vonage-voip.adapter.ts
import { VoipChannel } from './voip.channel';
import { SendVoipRequest, SendVoipResponse } from './interfaces';

export interface VonageVoipConfig {
  apiKey: string;
  apiSecret: string;
  fromNumber: string;
}

export class VonageVoipChannel extends VoipChannel {
  private config: VonageVoipConfig;

  constructor(config: VonageVoipConfig) {
    super(config, 'Vonage VoIP');
    this.config = config;
  }

  async sendVoip(request: SendVoipRequest): Promise<SendVoipResponse> {
    try {
      // Implement Vonage API call here
      const response = await this.callVonageAPI(request);

      return {
        success: true,
        callId: response.uuid,
        status: 'initiated',
      };
    } catch (error) {
      return {
        success: false,
        status: 'failed',
        error: {
          code: 'VONAGE_ERROR',
          message: error.message,
        },
      };
    }
  }

  private async callVonageAPI(request: SendVoipRequest): Promise<any> {
    // Implementation using Vonage SDK
    console.log('Calling Vonage API with:', request);
    return { uuid: 'call-456' };
  }
}

// Factory function
export function createVonageVoipChannel(config: VonageVoipConfig): VonageVoipChannel {
  return new VonageVoipChannel(config);
}
```

## Creating Multiple Adapters for a Channel

Now let's configure the NotificationManager to use multiple adapters with automatic fallback:

```typescript
import { NotificationManager } from '@townkrier/core';
import { createTwilioVoipChannel, createVonageVoipChannel } from './voip';

const manager = new NotificationManager({
  defaultChannel: 'voip',
  enableFallback: true, // Enable automatic fallback
  channels: [
    {
      name: 'voip',
      enabled: true,
      adapters: [
        // Primary adapter - Twilio (highest priority)
        {
          name: 'twilio',
          enabled: true,
          priority: 10,
          config: {
            apiKey: process.env.TWILIO_API_KEY,
            accountSid: process.env.TWILIO_ACCOUNT_SID,
            authToken: process.env.TWILIO_AUTH_TOKEN,
            fromNumber: process.env.TWILIO_FROM_NUMBER,
          },
        },
        // Fallback adapter - Vonage (lower priority)
        {
          name: 'vonage',
          enabled: true,
          priority: 5,
          config: {
            apiKey: process.env.VONAGE_API_KEY,
            apiSecret: process.env.VONAGE_API_SECRET,
            fromNumber: process.env.VONAGE_FROM_NUMBER,
          },
        },
      ],
    },
  ],
});

// Register the adapter factories
manager.registerFactory('twilio', createTwilioVoipChannel);
manager.registerFactory('vonage', createVonageVoipChannel);
```

## Implementing Adapter Fallback

The system automatically handles fallback when you configure multiple adapters:

```typescript
// Example: Email channel with multiple adapters
import { NotificationManager } from '@townkrier/core';
import { createResendChannel } from '@townkrier/resend';
import { createSmtpChannel } from './custom-smtp';
import { createPostmarkChannel } from './custom-postmark';

const manager = new NotificationManager({
  defaultChannel: 'email',
  enableFallback: true,
  channels: [
    {
      name: 'email',
      enabled: true,
      adapters: [
        // Primary: Resend (fast, modern API)
        {
          name: 'resend',
          enabled: true,
          priority: 10,
          config: {
            apiKey: process.env.RESEND_API_KEY,
            from: 'notifications@example.com',
          },
        },
        // Secondary: SMTP (reliable fallback)
        {
          name: 'smtp',
          enabled: true,
          priority: 5,
          config: {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            user: process.env.SMTP_USER,
            password: process.env.SMTP_PASSWORD,
            from: 'notifications@example.com',
          },
        },
        // Tertiary: Postmark (last resort)
        {
          name: 'postmark',
          enabled: true,
          priority: 3,
          config: {
            apiKey: process.env.POSTMARK_API_KEY,
            from: 'notifications@example.com',
          },
        },
      ],
    },
  ],
});

// Register all adapters
manager.registerFactory('resend', createResendChannel);
manager.registerFactory('smtp', createSmtpChannel);
manager.registerFactory('postmark', createPostmarkChannel);

// When you send a notification, the system will:
// 1. Try Resend first (priority 10)
// 2. If Resend fails, try SMTP (priority 5)
// 3. If SMTP fails, try Postmark (priority 3)
// 4. If all fail, throw an error
```

## Complete Examples

### Example 1: Social Media Channel (Twitter/X)

```typescript
// twitter-channel.ts
import { BaseNotificationChannel } from '@townkrier/core';

export interface TwitterConfig {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

export interface SendTwitterRequest {
  to: string; // @username
  message: string;
  mediaUrls?: string[];
}

export interface SendTwitterResponse {
  success: boolean;
  tweetId?: string;
  error?: {
    code: string;
    message: string;
  };
}

export class TwitterChannel extends BaseNotificationChannel {
  private config: TwitterConfig;

  constructor(config: TwitterConfig) {
    super(config, 'Twitter', 'social-media' as any);
    this.config = config;
  }

  async send(request: SendTwitterRequest): Promise<SendTwitterResponse> {
    try {
      // Implement Twitter API call
      const response = await this.sendDM(request);

      return {
        success: true,
        tweetId: response.id,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TWITTER_ERROR',
          message: error.message,
        },
      };
    }
  }

  private async sendDM(request: SendTwitterRequest): Promise<any> {
    console.log('Sending Twitter DM:', request);
    return { id: 'dm-123' };
  }
}

export function createTwitterChannel(config: TwitterConfig): TwitterChannel {
  return new TwitterChannel(config);
}
```

### Example 2: Complete Multi-Channel Setup

```typescript
import { NotificationManager, Notification, NotificationChannel } from '@townkrier/core';
import { createResendChannel } from '@townkrier/resend';
import { createTermiiChannel } from '@townkrier/termii';
import { createTwilioVoipChannel } from './voip/twilio';
import { createTwitterChannel } from './social/twitter';

// Setup manager with multiple channels and adapters
const manager = new NotificationManager({
  defaultChannel: 'email',
  enableFallback: true,
  channels: [
    // Email channel with multiple adapters
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
            from: 'notifications@example.com',
          },
        },
      ],
    },
    // SMS channel
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
            senderId: 'MyApp',
          },
        },
      ],
    },
    // Custom VoIP channel
    {
      name: 'voip',
      enabled: true,
      adapters: [
        {
          name: 'twilio',
          enabled: true,
          priority: 10,
          config: {
            apiKey: process.env.TWILIO_API_KEY,
            accountSid: process.env.TWILIO_ACCOUNT_SID,
            authToken: process.env.TWILIO_AUTH_TOKEN,
            fromNumber: '+1234567890',
          },
        },
      ],
    },
    // Custom social media channel
    {
      name: 'twitter',
      enabled: true,
      adapters: [
        {
          name: 'twitter',
          enabled: true,
          priority: 10,
          config: {
            apiKey: process.env.TWITTER_API_KEY,
            apiSecret: process.env.TWITTER_API_SECRET,
            accessToken: process.env.TWITTER_ACCESS_TOKEN,
            accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
          },
        },
      ],
    },
  ],
});

// Register all factories
manager.registerFactory('resend', createResendChannel);
manager.registerFactory('termii', createTermiiChannel);
manager.registerFactory('twilio', createTwilioVoipChannel);
manager.registerFactory('twitter', createTwitterChannel);

// Use the manager
class UrgentAlertNotification extends Notification {
  constructor(private alertMessage: string) {
    super();
  }

  via() {
    // Send through email, SMS, and VoIP for urgent alerts
    return [NotificationChannel.EMAIL, NotificationChannel.SMS, 'voip' as any];
  }

  toEmail() {
    return {
      subject: '⚠️ Urgent Alert',
      html: `<h1>Urgent Alert</h1><p>${this.alertMessage}</p>`,
    };
  }

  toSms() {
    return {
      message: `⚠️ URGENT: ${this.alertMessage}`,
    };
  }

  // Custom method for VoIP
  toVoip() {
    return {
      message: this.alertMessage,
      voice: 'female',
      language: 'en-US',
    };
  }
}
```

## Best Practices

1. **Always provide fallback adapters** for critical channels
2. **Set appropriate priorities** - higher for more reliable/faster services
3. **Handle errors gracefully** in your adapter implementations
4. **Use environment variables** for API keys and secrets
5. **Test each adapter independently** before enabling in production
6. **Monitor adapter success rates** to adjust priorities over time
7. **Implement proper logging** to track which adapters are used
8. **Consider cost** when setting priorities (some services are cheaper than others)

## Troubleshooting

### Adapter Not Being Called

- Ensure `enabled: true` is set
- Check that the factory name matches the adapter name
- Verify the adapter is registered before sending notifications

### Fallback Not Working

- Ensure `enableFallback: true` in NotificationManager config
- Check that lower priority adapters are properly configured
- Verify error handling in your adapter implementation

### All Adapters Failing

- Check API credentials are correct
- Verify network connectivity to service providers
- Review error logs for specific failure reasons
- Ensure adapters implement proper error handling
