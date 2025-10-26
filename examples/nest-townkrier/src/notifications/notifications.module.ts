import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationService } from './services/notification.service';
import { DashboardService } from './services/dashboard.service';
import { NotificationsController } from './controllers/notifications.controller';
import { QueueController } from './controllers/queue.controller';

@Module({
  imports: [ConfigModule],
  controllers: [NotificationsController, QueueController],
  providers: [NotificationService, DashboardService],
  exports: [NotificationService, DashboardService],
})
export class NotificationsModule {}
