import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotificationService } from '../services/notification.service';
import {
  SendNotificationDto,
  QueueNotificationDto,
  SendBulkNotificationDto,
} from '../dto/send-notification.dto';
import {
  NotificationResponseDto,
  BulkNotificationResponseDto,
} from '../dto/notification-response.dto';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a notification immediately' })
  @ApiResponse({
    status: 200,
    description: 'Notification sent successfully',
    type: NotificationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async sendNotification(
    @Body() dto: SendNotificationDto,
  ): Promise<NotificationResponseDto> {
    return this.notificationService.sendNotification(dto);
  }

  @Post('queue')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Queue a notification for background processing' })
  @ApiResponse({
    status: 202,
    description: 'Notification queued successfully',
    type: NotificationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async queueNotification(
    @Body() dto: QueueNotificationDto,
  ): Promise<NotificationResponseDto> {
    return this.notificationService.queueNotification(dto);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send multiple notifications' })
  @ApiResponse({
    status: 200,
    description: 'Bulk notifications processed',
    type: BulkNotificationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async sendBulkNotifications(
    @Body() dto: SendBulkNotificationDto,
  ): Promise<BulkNotificationResponseDto> {
    return this.notificationService.sendBulkNotifications(dto.recipients);
  }

  @Get('health')
  @ApiOperation({ summary: 'Check notification service health' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async healthCheck() {
    return {
      status: 'ok',
      message: 'Notification service is running',
      timestamp: new Date().toISOString(),
    };
  }
}
