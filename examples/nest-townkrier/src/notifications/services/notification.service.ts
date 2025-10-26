import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  NotificationManager,
  getEventDispatcher,
  NotificationSending,
  NotificationSent,
  NotificationFailed,
  Notifiable,
  Notification,
  NotificationChannel,
  NotificationRecipient,
} from '@townkrier/core';
import {
  QueueManager,
  InMemoryQueueAdapter,
  JobPriority,
} from '@townkrier/queue';
import {
  StorageManager,
  InMemoryStorageAdapter,
  ContentPrivacy,
} from '@townkrier/storage';
import { createResendChannel } from '@townkrier/resend';
import {
  SendNotificationDto,
  QueueNotificationDto,
  NotificationType,
} from '../dto/send-notification.dto';
import { WelcomeNotification } from '../classes/welcome.notification';
import { OrderConfirmationNotification } from '../classes/order-confirmation.notification';
import { PasswordResetNotification } from '../classes/password-reset.notification';
import { PaymentReceivedNotification } from '../classes/payment-received.notification';

/**
 * User class implementing Notifiable interface
 */
class User implements Notifiable {
  constructor(
    public id: string,
    public email: string,
    public phone?: string,
    public name?: string,
  ) {}

  routeNotificationFor(channel: string): string | undefined {
    switch (channel) {
      case 'email':
        return this.email;
      case 'sms':
        return this.phone;
      case 'push':
        // Return device token if available
        return undefined;
      default:
        return this.email;
    }
  }

  getNotificationName(): string {
    return this.name || 'User';
  }
}

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger(NotificationService.name);
  private notificationManager: NotificationManager;
  private queueManager: QueueManager;
  private storageManager: StorageManager;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.logger.log('Initializing TownKrier Notification Service...');

    // Setup event listeners
    const eventDispatcher = getEventDispatcher();

    eventDispatcher.on(NotificationSending, async (event) => {
      this.logger.log(
        `📤 Sending notification via channels: ${event.channels.join(', ')}`,
      );
    });

    eventDispatcher.on(NotificationSent, async (event) => {
      this.logger.log(
        `✅ Notification sent successfully via: ${event.channels.join(', ')}`,
      );
    });

    eventDispatcher.on(NotificationFailed, async (event) => {
      this.logger.error(
        `❌ Notification failed on channel: ${event.failedChannel}`,
        event.error.message,
      );
    });

    // Initialize NotificationManager
    this.notificationManager = new NotificationManager(
      {
        defaultChannel: 'email-resend',
        enableFallback: true,
        channels: [
          {
            name: 'email-resend',
            enabled: true,
            priority: 10,
            config: {
              apiKey:
                this.configService.get<string>('RESEND_API_KEY') || 'test-key',
              from:
                this.configService.get<string>('RESEND_FROM_EMAIL') ||
                'notifications@example.com',
              fromName:
                this.configService.get<string>('RESEND_FROM_NAME') ||
                'TownKrier App',
              debug:
                this.configService.get<string>('NODE_ENV') === 'development',
            },
          },
        ],
      },
      eventDispatcher,
    );

    // Register channel factories
    this.notificationManager.registerFactory(
      'email-resend',
      createResendChannel,
    );

    // Initialize Queue Manager
    const queueAdapter = new InMemoryQueueAdapter({
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 30000,
      pollInterval: 1000,
    });

    this.queueManager = new QueueManager(
      queueAdapter,
      this.notificationManager,
    );
    this.queueManager.startProcessing({ pollInterval: 2000 });

    // Initialize Storage Manager
    const storageAdapter = new InMemoryStorageAdapter({
      maskSensitiveContent: true,
      contentPrivacyLevel: ContentPrivacy.MASKED,
      retentionDays: 30,
      autoCleanup: false,
    });

    this.storageManager = new StorageManager(storageAdapter);

    this.logger.log(
      '✅ TownKrier Notification Service initialized successfully',
    );
  }

  /**
   * Get notification manager instance
   */
  getNotificationManager(): NotificationManager {
    return this.notificationManager;
  }

  /**
   * Get queue manager instance
   */
  getQueueManager(): QueueManager {
    return this.queueManager;
  }

  /**
   * Get storage manager instance
   */
  getStorageManager(): StorageManager {
    return this.storageManager;
  }

  /**
   * Send a notification immediately
   */
  async sendNotification(dto: SendNotificationDto): Promise<any> {
    const notification = this.createNotification(dto);

    // Create recipient object with all required channels
    const recipient: NotificationRecipient = {
      [NotificationChannel.EMAIL]: dto.email,
      [NotificationChannel.SMS]: dto.phone,
    };

    try {
      const result = await this.notificationManager.send(
        notification,
        recipient,
      );

      return {
        success: true,
        message: 'Notification sent successfully',
        channels: Array.from(result.keys()),
      };
    } catch (error) {
      this.logger.error('Failed to send notification:', error);
      throw error;
    }
  }

  /**
   * Queue a notification for later sending
   */
  async queueNotification(dto: QueueNotificationDto): Promise<any> {
    const notification = this.createNotification(dto);

    // Create recipient object with all required channels
    const recipient: NotificationRecipient = {
      [NotificationChannel.EMAIL]: dto.email,
      [NotificationChannel.SMS]: dto.phone,
    };

    try {
      const config: any = {
        priority: this.mapPriority(dto.priority),
      };

      // If delay is provided, calculate scheduled time
      if (dto.delay) {
        config.scheduledFor = new Date(Date.now() + dto.delay);
      }

      const job = await this.queueManager.enqueue(
        notification,
        recipient,
        config,
      );

      return {
        success: true,
        message: 'Notification queued successfully',
        jobId: job.id,
      };
    } catch (error) {
      this.logger.error('Failed to queue notification:', error);
      throw error;
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(dtos: SendNotificationDto[]): Promise<any> {
    const results = await Promise.allSettled(
      dtos.map((dto) => this.sendNotification(dto)),
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return {
      total: dtos.length,
      successful,
      failed,
      results: results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            success: false,
            error: result.reason.message,
            email: dtos[index].email,
          };
        }
      }),
    };
  }

  /**
   * Create notification instance based on type
   */
  private createNotification(dto: SendNotificationDto): Notification {
    switch (dto.type) {
      case NotificationType.WELCOME:
        return new WelcomeNotification(
          dto.name || 'User',
          dto.email,
          'TownKrier App',
        );

      case NotificationType.ORDER_CONFIRMATION:
        return new OrderConfirmationNotification(
          dto.data?.orderId || 'ORD-001',
          dto.data?.amount || 0,
          dto.data?.itemCount || 1,
          dto.name || 'User',
        );

      case NotificationType.PASSWORD_RESET:
        return new PasswordResetNotification(
          dto.data?.resetToken || 'reset-token',
          dto.name || 'User',
          dto.data?.expiresInMinutes || 60,
        );

      case NotificationType.PAYMENT_RECEIVED:
        return new PaymentReceivedNotification(
          dto.data?.amount || 0,
          dto.data?.currency || 'USD',
          dto.data?.transactionId || 'TXN-001',
          dto.name || 'User',
        );

      default:
        throw new Error(`Unknown notification type: ${dto.type}`);
    }
  }

  /**
   * Map priority string to JobPriority enum
   */
  private mapPriority(priority?: string): JobPriority {
    switch (priority) {
      case 'low':
        return JobPriority.LOW;
      case 'high':
        return JobPriority.HIGH;
      case 'critical':
        return JobPriority.CRITICAL;
      default:
        return JobPriority.NORMAL;
    }
  }
}
