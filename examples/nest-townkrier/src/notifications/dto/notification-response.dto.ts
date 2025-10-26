import { ApiProperty } from '@nestjs/swagger';

export class NotificationResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Notification ID (if available)' })
  notificationId?: string;

  @ApiProperty({ description: 'Channels used to send the notification' })
  channels?: string[];

  @ApiProperty({ description: 'Job ID (for queued notifications)' })
  jobId?: string;

  @ApiProperty({ description: 'Error message (if failed)' })
  error?: string;
}

export class BulkNotificationResponseDto {
  @ApiProperty({ description: 'Total number of notifications' })
  total: number;

  @ApiProperty({ description: 'Number of successful notifications' })
  successful: number;

  @ApiProperty({ description: 'Number of failed notifications' })
  failed: number;

  @ApiProperty({
    description: 'List of results',
    type: [NotificationResponseDto],
  })
  results: NotificationResponseDto[];
}
