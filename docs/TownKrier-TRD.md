# TownKrier - Technical Requirements Document (TRD)

**Version:** 1.0  
**Date:** October 24, 2025  
**Status:** Draft

---

## 1. Executive Summary

This Technical Requirements Document (TRD) defines the technical architecture, implementation details, and engineering specifications for TownKrier - a Laravel-inspired notification system for Node.js. This document serves as the technical blueprint for development teams implementing the system.

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  (Express, NestJS, Fastify, or standalone Node.js app)      │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                  TownKrier Core Layer                        │
│  ┌────────────────────────────────────────────────────┐     │
│  │  NotificationManager (Orchestrator)                │     │
│  │  - Route notifications to channels                 │     │
│  │  - Execute interceptor chain                       │     │
│  │  - Handle failures & retries                       │     │
│  └────────────┬───────────────────────────────────────┘     │
│               │                                              │
│  ┌────────────▼───────────────────────────────────────┐     │
│  │  Interceptor Pipeline                              │     │
│  │  - Before/After hooks                              │     │
│  │  - Logging, monitoring, validation                 │     │
│  │  - Error handling & transformation                 │     │
│  └────────────┬───────────────────────────────────────┘     │
└───────────────┼──────────────────────────────────────────────┘
                │
┌───────────────▼──────────────────────────────────────────────┐
│                    Channel Layer                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │   Mail   │  │   SMS    │  │   Push   │  │ Database │    │
│  │ Channel  │  │ Channel  │  │ Channel  │  │ Channel  │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
└───────┼─────────────┼─────────────┼─────────────┼───────────┘
        │             │             │             │
┌───────▼─────────────▼─────────────▼─────────────▼───────────┐
│                    Provider Layer                            │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ Resend  │ │ Twilio  │ │   FCM   │ │Postgres │           │
│  │Provider │ │Provider │ │Provider │ │Adapter  │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
└──────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    Queue Layer (Optional)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │  BullMQ  │  │   SQS    │  │  Redis   │                  │
│  │  Adapter │  │  Adapter │  │  Adapter │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Component Interaction Flow

```
User Request → Notification Creation → Interceptor Chain (Before) 
  → Channel Selection → Provider Execution → Interceptor Chain (After) 
  → Result/Error Handling → Response
```

---

## 3. Core Package Architecture

### 3.1 Package: `@townkrier/core`

#### 3.1.1 Directory Structure
```
packages/core/
├── src/
│   ├── index.ts                    # Main exports
│   ├── notification.ts             # Base Notification class
│   ├── notifiable.ts               # Notifiable interface
│   ├── channel.ts                  # Channel interface & base
│   ├── message.ts                  # Message classes
│   ├── manager.ts                  # NotificationManager
│   ├── interceptor.ts              # Interceptor system
│   ├── queue.ts                    # Queue interfaces
│   ├── types.ts                    # TypeScript types
│   ├── errors.ts                   # Custom error classes
│   ├── events/
│   │   ├── emitter.ts              # Event emitter
│   │   ├── events.ts               # Event definitions
│   │   └── index.ts
│   ├── testing/
│   │   ├── fake.ts                 # Fake notification system
│   │   ├── assertions.ts           # Test assertions
│   │   └── index.ts
│   └── utils/
│       ├── logger.ts               # Internal logger
│       ├── retry.ts                # Retry logic
│       └── validator.ts            # Validation utilities
├── __tests__/
│   ├── notification.test.ts
│   ├── manager.test.ts
│   ├── interceptor.test.ts
│   └── ...
├── package.json
├── tsconfig.json
└── README.md
```

#### 3.1.2 Core Interfaces

```typescript
// src/types.ts
export interface NotificationConfig {
  channels?: Record<string, ChannelConfig>;
  defaults?: {
    channels?: string[];
  };
  interceptors?: InterceptorConfig[];
  queue?: QueueConfig;
  retries?: number;
  timeout?: number;
}

export interface ChannelConfig {
  provider: string;
  config: Record<string, unknown>;
  fallback?: ChannelConfig;
  timeout?: number;
}

export interface QueueConfig {
  driver: string;
  connection: Record<string, unknown>;
  retries?: number;
  backoff?: 'linear' | 'exponential';
  defaultQueue?: string;
}

export interface InterceptorConfig {
  interceptor: NotificationInterceptor;
  channels?: string[];
  priority?: number;
}

export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'queued';

export interface NotificationResult {
  channel: string;
  status: NotificationStatus;
  metadata?: Record<string, unknown>;
  error?: Error;
  duration?: number;
  timestamp: Date;
}

export interface NotificationContext {
  notification: Notification;
  notifiable: Notifiable;
  channel: string;
  metadata: Map<string, unknown>;
  startTime: number;
}
```

#### 3.1.3 Interceptor System

```typescript
// src/interceptor.ts
export interface InterceptorContext {
  notification: Notification;
  notifiable: Notifiable;
  channel: string;
  metadata: Map<string, unknown>;
}

export interface NotificationInterceptor {
  /**
   * Called before the notification is sent
   * Return false to prevent sending
   */
  before?(context: InterceptorContext): Promise<boolean | void> | boolean | void;

  /**
   * Called after the notification is sent (success or failure)
   */
  after?(
    context: InterceptorContext,
    result: NotificationResult
  ): Promise<void> | void;

  /**
   * Called when an error occurs
   */
  onError?(
    context: InterceptorContext,
    error: Error
  ): Promise<void> | void;

  /**
   * Priority (higher numbers execute first)
   */
  priority?: number;

  /**
   * Which channels this interceptor applies to (empty = all)
   */
  channels?: string[];
}

export class InterceptorChain {
  private interceptors: NotificationInterceptor[] = [];

  add(interceptor: NotificationInterceptor): this {
    this.interceptors.push(interceptor);
    this.interceptors.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    return this;
  }

  async executeBefore(context: InterceptorContext): Promise<boolean> {
    for (const interceptor of this.getApplicableInterceptors(context.channel)) {
      if (interceptor.before) {
        const result = await interceptor.before(context);
        if (result === false) {
          return false; // Stop execution
        }
      }
    }
    return true;
  }

  async executeAfter(
    context: InterceptorContext,
    result: NotificationResult
  ): Promise<void> {
    for (const interceptor of this.getApplicableInterceptors(context.channel)) {
      if (interceptor.after) {
        await interceptor.after(context, result);
      }
    }
  }

  async executeError(
    context: InterceptorContext,
    error: Error
  ): Promise<void> {
    for (const interceptor of this.getApplicableInterceptors(context.channel)) {
      if (interceptor.onError) {
        await interceptor.onError(context, error);
      }
    }
  }

  private getApplicableInterceptors(channel: string): NotificationInterceptor[] {
    return this.interceptors.filter(
      (i) => !i.channels || i.channels.length === 0 || i.channels.includes(channel)
    );
  }
}
```

#### 3.1.4 Notification Base Class

```typescript
// src/notification.ts
export abstract class Notification {
  protected metadata = new Map<string, unknown>();

  /**
   * Determine which channels the notification should be sent on
   */
  abstract via(notifiable: Notifiable): string[] | Promise<string[]>;

  /**
   * Get the notification's unique identifier
   */
  id(): string {
    return `${this.constructor.name}-${Date.now()}-${Math.random().toString(36)}`;
  }

  /**
   * Set metadata for this notification
   */
  withMeta(key: string, value: unknown): this {
    this.metadata.set(key, value);
    return this;
  }

  /**
   * Get metadata value
   */
  getMeta<T = unknown>(key: string): T | undefined {
    return this.metadata.get(key) as T | undefined;
  }

  /**
   * Queue configuration for this notification
   */
  queueOptions(): QueueOptions | null {
    return null;
  }

  /**
   * Rate limiting configuration
   */
  rateLimit(): RateLimitConfig | null {
    return null;
  }

  /**
   * Retry configuration
   */
  retryConfig(): RetryConfig {
    return {
      maxAttempts: 3,
      backoff: 'exponential',
      initialDelay: 1000,
    };
  }

  /**
   * Locale for this notification
   */
  locale(notifiable: Notifiable): string | null {
    return null;
  }
}

export interface QueueOptions {
  queue?: string;
  delay?: number;
  priority?: number;
  attempts?: number;
}

export interface RateLimitConfig {
  maxAttempts: number;
  decayMinutes: number;
  key?: string;
}

export interface RetryConfig {
  maxAttempts: number;
  backoff: 'linear' | 'exponential';
  initialDelay: number;
}
```

#### 3.1.5 NotificationManager Implementation

```typescript
// src/manager.ts
import { EventEmitter } from './events/emitter';
import { InterceptorChain } from './interceptor';
import type { Channel } from './channel';
import type { Notification } from './notification';
import type { Notifiable } from './notifiable';
import type { NotificationConfig, NotificationResult, InterceptorContext } from './types';

export class NotificationManager {
  private channels = new Map<string, Channel>();
  private config: NotificationConfig;
  private interceptors: InterceptorChain;
  private events: EventEmitter;
  private queueManager?: QueueManager;

  constructor(config: NotificationConfig = {}) {
    this.config = config;
    this.interceptors = new InterceptorChain();
    this.events = new EventEmitter();

    // Register interceptors from config
    if (config.interceptors) {
      config.interceptors.forEach((ic) => {
        this.interceptors.add(ic.interceptor);
      });
    }
  }

  /**
   * Register a notification channel
   */
  channel(name: string, channel: Channel): this {
    this.channels.set(name, channel);
    return this;
  }

  /**
   * Add an interceptor
   */
  intercept(interceptor: NotificationInterceptor): this {
    this.interceptors.add(interceptor);
    return this;
  }

  /**
   * Register event listener
   */
  on(event: string, listener: (...args: unknown[]) => void): this {
    this.events.on(event, listener);
    return this;
  }

  /**
   * Send notification(s) immediately
   */
  async send(
    notifiable: Notifiable | Notifiable[],
    notification: Notification
  ): Promise<NotificationResult[]> {
    const notifiables = Array.isArray(notifiable) ? notifiable : [notifiable];
    const allResults: NotificationResult[] = [];

    for (const entity of notifiables) {
      const channels = await notification.via(entity);
      const results = await this.sendToChannels(entity, notification, channels);
      allResults.push(...results);
    }

    return allResults;
  }

  /**
   * Queue notification(s) for background processing
   */
  async queue(
    notifiable: Notifiable | Notifiable[],
    notification: Notification
  ): Promise<void> {
    if (!this.queueManager) {
      throw new Error('Queue manager not configured');
    }

    const notifiables = Array.isArray(notifiable) ? notifiable : [notifiable];
    const queueOptions = notification.queueOptions();

    for (const entity of notifiables) {
      await this.queueManager.push({
        notifiable: entity,
        notification,
        options: queueOptions,
      });
    }
  }

  /**
   * Send to specific channels with interceptor support
   */
  private async sendToChannels(
    notifiable: Notifiable,
    notification: Notification,
    channelNames: string[]
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    for (const channelName of channelNames) {
      const result = await this.sendToChannel(
        notifiable,
        notification,
        channelName
      );
      results.push(result);
    }

    return results;
  }

  /**
   * Send to a single channel with full interceptor chain
   */
  private async sendToChannel(
    notifiable: Notifiable,
    notification: Notification,
    channelName: string
  ): Promise<NotificationResult> {
    const startTime = Date.now();
    const context: InterceptorContext = {
      notification,
      notifiable,
      channel: channelName,
      metadata: new Map(),
    };

    // Emit before event
    await this.events.emit('notification.sending', {
      notification,
      notifiable,
      channel: channelName,
    });

    try {
      // Execute before interceptors
      const shouldContinue = await this.interceptors.executeBefore(context);
      
      if (!shouldContinue) {
        const result: NotificationResult = {
          channel: channelName,
          status: 'failed',
          error: new Error('Interceptor prevented notification'),
          duration: Date.now() - startTime,
          timestamp: new Date(),
        };

        await this.interceptors.executeAfter(context, result);
        return result;
      }

      // Get channel
      const channel = this.channels.get(channelName);
      if (!channel) {
        throw new Error(`Channel ${channelName} not found`);
      }

      // Send notification
      await channel.send(notifiable, notification);

      // Create success result
      const result: NotificationResult = {
        channel: channelName,
        status: 'sent',
        duration: Date.now() - startTime,
        timestamp: new Date(),
        metadata: Object.fromEntries(context.metadata),
      };

      // Execute after interceptors
      await this.interceptors.executeAfter(context, result);

      // Emit success event
      await this.events.emit('notification.sent', {
        notification,
        notifiable,
        channel: channelName,
        result,
      });

      return result;

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      // Execute error interceptors
      await this.interceptors.executeError(context, err);

      // Create failure result
      const result: NotificationResult = {
        channel: channelName,
        status: 'failed',
        error: err,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };

      // Execute after interceptors even on failure
      await this.interceptors.executeAfter(context, result);

      // Emit failure event
      await this.events.emit('notification.failed', {
        notification,
        notifiable,
        channel: channelName,
        error: err,
      });

      return result;
    }
  }

  /**
   * Set queue manager
   */
  setQueueManager(manager: QueueManager): this {
    this.queueManager = manager;
    return this;
  }
}
```

#### 3.1.6 Event System

```typescript
// src/events/emitter.ts
type EventListener = (...args: unknown[]) => void | Promise<void>;

export class EventEmitter {
  private listeners = new Map<string, EventListener[]>();

  on(event: string, listener: EventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  off(event: string, listener: EventListener): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  async emit(event: string, ...args: unknown[]): Promise<void> {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      for (const listener of eventListeners) {
        await listener(...args);
      }
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

// src/events/events.ts
export const NotificationEvents = {
  SENDING: 'notification.sending',
  SENT: 'notification.sent',
  FAILED: 'notification.failed',
  QUEUED: 'notification.queued',
} as const;
```

#### 3.1.7 Testing Utilities

```typescript
// src/testing/fake.ts
export class FakeNotificationManager {
  private sentNotifications: Array<{
    notifiable: Notifiable;
    notification: Notification;
    channels: string[];
    timestamp: Date;
  }> = [];

  async send(
    notifiable: Notifiable | Notifiable[],
    notification: Notification
  ): Promise<NotificationResult[]> {
    const notifiables = Array.isArray(notifiable) ? notifiable : [notifiable];
    const results: NotificationResult[] = [];

    for (const entity of notifiables) {
      const channels = await notification.via(entity);
      
      this.sentNotifications.push({
        notifiable: entity,
        notification,
        channels,
        timestamp: new Date(),
      });

      for (const channel of channels) {
        results.push({
          channel,
          status: 'sent',
          timestamp: new Date(),
          duration: 0,
        });
      }
    }

    return results;
  }

  getSent(): typeof this.sentNotifications {
    return this.sentNotifications;
  }

  clear(): void {
    this.sentNotifications = [];
  }
}

// src/testing/assertions.ts
export class NotificationAssertions {
  constructor(private fake: FakeNotificationManager) {}

  assertSent(
    notificationClass: new (...args: any[]) => Notification,
    callback?: (notification: Notification) => boolean
  ): void {
    const sent = this.fake.getSent();
    const matches = sent.filter((item) => {
      if (!(item.notification instanceof notificationClass)) {
        return false;
      }
      return callback ? callback(item.notification) : true;
    });

    if (matches.length === 0) {
      throw new Error(
        `Expected ${notificationClass.name} to be sent but it was not.`
      );
    }
  }

  assertNotSent(
    notificationClass: new (...args: any[]) => Notification
  ): void {
    const sent = this.fake.getSent();
    const matches = sent.filter(
      (item) => item.notification instanceof notificationClass
    );

    if (matches.length > 0) {
      throw new Error(
        `Expected ${notificationClass.name} not to be sent but it was sent ${matches.length} time(s).`
      );
    }
  }

  assertSentTo(
    notifiable: Notifiable,
    notificationClass: new (...args: any[]) => Notification
  ): void {
    const sent = this.fake.getSent();
    const matches = sent.filter(
      (item) =>
        item.notifiable === notifiable &&
        item.notification instanceof notificationClass
    );

    if (matches.length === 0) {
      throw new Error(
        `Expected ${notificationClass.name} to be sent to the given notifiable but it was not.`
      );
    }
  }

  assertCount(count: number): void {
    const sent = this.fake.getSent();
    if (sent.length !== count) {
      throw new Error(
        `Expected ${count} notification(s) to be sent but ${sent.length} were sent.`
      );
    }
  }

  assertSentVia(
    notificationClass: new (...args: any[]) => Notification,
    channel: string
  ): void {
    const sent = this.fake.getSent();
    const matches = sent.filter(
      (item) =>
        item.notification instanceof notificationClass &&
        item.channels.includes(channel)
    );

    if (matches.length === 0) {
      throw new Error(
        `Expected ${notificationClass.name} to be sent via ${channel} but it was not.`
      );
    }
  }
}
```

---

## 4. Channel Architecture

### 4.1 Channel Interface

```typescript
// Base channel interface
export interface Channel {
  /**
   * Send the notification
   */
  send(notifiable: Notifiable, notification: Notification): Promise<void>;

  /**
   * Channel name
   */
  name(): string;

  /**
   * Validate channel-specific configuration
   */
  validate?(config: ChannelConfig): void;
}

// Abstract base class with common functionality
export abstract class BaseChannel implements Channel {
  constructor(protected config: ChannelConfig) {}

  abstract send(notifiable: Notifiable, notification: Notification): Promise<void>;
  
  abstract name(): string;

  protected getRecipient(notifiable: Notifiable): string | string[] | null {
    return notifiable.routeNotificationFor(this.name());
  }

  protected async withRetry<T>(
    fn: () => Promise<T>,
    retryConfig: RetryConfig
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt < retryConfig.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < retryConfig.maxAttempts - 1) {
          const delay = this.calculateBackoff(
            attempt,
            retryConfig.initialDelay,
            retryConfig.backoff
          );
          await this.sleep(delay);
        }
      }
    }

    throw lastError!;
  }

  private calculateBackoff(
    attempt: number,
    initialDelay: number,
    strategy: 'linear' | 'exponential'
  ): number {
    if (strategy === 'exponential') {
      return initialDelay * Math.pow(2, attempt);
    }
    return initialDelay * (attempt + 1);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

### 4.2 Mail Channel Example

```typescript
// packages/channels/mail/src/index.ts
import { BaseChannel } from '@townkrier/core';
import type { Notification, Notifiable, ChannelConfig } from '@townkrier/core';

export interface MailProvider {
  send(message: MailMessage): Promise<void>;
}

export class MailMessage {
  private data: {
    to?: string | string[];
    from?: string;
    subject?: string;
    html?: string;
    text?: string;
    attachments?: Attachment[];
    replyTo?: string;
    cc?: string[];
    bcc?: string[];
  } = {};

  to(address: string | string[]): this {
    this.data.to = address;
    return this;
  }

  from(address: string): this {
    this.data.from = address;
    return this;
  }

  subject(subject: string): this {
    this.data.subject = subject;
    return this;
  }

  line(text: string): this {
    if (!this.data.html) {
      this.data.html = '';
    }
    this.data.html += `<p>${text}</p>`;
    return this;
  }

  action(text: string, url: string): this {
    if (!this.data.html) {
      this.data.html = '';
    }
    this.data.html += `<a href="${url}" style="display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 4px;">${text}</a>`;
    return this;
  }

  html(content: string): this {
    this.data.html = content;
    return this;
  }

  text(content: string): this {
    this.data.text = content;
    return this;
  }

  attach(attachment: Attachment): this {
    if (!this.data.attachments) {
      this.data.attachments = [];
    }
    this.data.attachments.push(attachment);
    return this;
  }

  toJSON() {
    return this.data;
  }
}

export interface Attachment {
  filename: string;
  content?: Buffer | string;
  path?: string;
  contentType?: string;
}

export class MailChannel extends BaseChannel {
  private provider: MailProvider;

  constructor(config: ChannelConfig, provider: MailProvider) {
    super(config);
    this.provider = provider;
  }

  name(): string {
    return 'mail';
  }

  async send(notifiable: Notifiable, notification: Notification): Promise<void> {
    // Check if notification has toMail method
    if (!('toMail' in notification)) {
      throw new Error(
        `Notification ${notification.constructor.name} is missing toMail() method`
      );
    }

    const message = (notification as any).toMail(notifiable) as MailMessage;
    
    // Set recipient
    const recipient = this.getRecipient(notifiable);
    if (!recipient) {
      throw new Error('No email address found for notifiable');
    }
    
    if (!message.toJSON().to) {
      message.to(recipient);
    }

    // Send with retry
    await this.withRetry(
      () => this.provider.send(message),
      notification.retryConfig()
    );
  }
}
```

---

## 5. Provider Architecture

### 5.1 Provider Interface Pattern

```typescript
// Each provider implements a channel-specific interface
export interface MailProvider {
  send(message: MailMessage): Promise<MailProviderResponse>;
}

export interface SmsProvider {
  send(message: SmsMessage): Promise<SmsProviderResponse>;
}

export interface PushProvider {
  send(message: PushMessage): Promise<PushProviderResponse>;
}

export interface ProviderResponse {
  id: string;
  status: 'sent' | 'queued' | 'failed';
  metadata?: Record<string, unknown>;
}
```

### 5.2 Example: Resend Provider

```typescript
// packages/providers/resend/src/index.ts
import { Resend as ResendSDK } from 'resend';
import type { MailProvider, MailMessage } from '@townkrier/channel-mail';

export interface ResendConfig {
  apiKey: string;
  from?: string;
}

export class ResendProvider implements MailProvider {
  private client: ResendSDK;
  private defaultFrom?: string;

  constructor(config: ResendConfig) {
    this.client = new ResendSDK(config.apiKey);
    this.defaultFrom = config.from;
  }

  async send(message: MailMessage): Promise<MailProviderResponse> {
    const data = message.toJSON();

    const response = await this.client.emails.send({
      from: data.from || this.defaultFrom!,
      to: Array.isArray(data.to) ? data.to : [data.to!],
      subject: data.subject!,
      html: data.html,
      text: data.text,
      reply_to: data.replyTo,
      cc: data.cc,
      bcc: data.bcc,
      attachments: data.attachments?.map((att) => ({
        filename: att.filename,
        content: att.content,
        path: att.path,
        content_type: att.contentType,
      })),
    });

    return {
      id: response.id,
      status: 'sent',
      metadata: { response },
    };
  }
}
```

---

## 6. Built-in Interceptors

### 6.1 Logging Interceptor

```typescript
// packages/core/src/interceptors/logging.ts
import type { NotificationInterceptor, InterceptorContext, NotificationResult } from '../types';

export interface LoggingInterceptorOptions {
  logger?: Logger;