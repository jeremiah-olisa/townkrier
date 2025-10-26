import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  IsEnum,
  IsObject,
} from 'class-validator';

export enum NotificationType {
  WELCOME = 'welcome',
  ORDER_CONFIRMATION = 'order_confirmation',
  PASSWORD_RESET = 'password_reset',
  PAYMENT_RECEIVED = 'payment_received',
  CUSTOM = 'custom',
}

export class SendNotificationDto {
  @ApiProperty({
    description: 'Type of notification to send',
    enum: NotificationType,
    example: NotificationType.WELCOME,
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    description: 'Recipient email address',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Recipient phone number (for SMS)',
    example: '+1234567890',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Recipient name',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Additional data for the notification',
    example: { orderId: '12345', amount: 99.99 },
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}

export class QueueNotificationDto extends SendNotificationDto {
  @ApiPropertyOptional({
    description: 'Delay before sending (in milliseconds)',
    example: 5000,
  })
  @IsOptional()
  delay?: number;

  @ApiPropertyOptional({
    description: 'Priority of the notification job',
    enum: ['low', 'normal', 'high', 'critical'],
    example: 'normal',
  })
  @IsOptional()
  @IsEnum(['low', 'normal', 'high', 'critical'])
  priority?: 'low' | 'normal' | 'high' | 'critical';
}

export class SendBulkNotificationDto {
  @ApiProperty({
    description: 'List of recipients',
    type: [SendNotificationDto],
  })
  @IsArray()
  recipients: SendNotificationDto[];
}
