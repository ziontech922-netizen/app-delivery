import { IsString, IsOptional, IsEnum, IsObject, ValidateNested, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum NotificationType {
  PUSH = 'push',
  EMAIL = 'email',
}

export enum NotificationEvent {
  ORDER_CONFIRMED = 'order_confirmed',
  ORDER_PREPARING = 'order_preparing',
  ORDER_READY = 'order_ready',
  DRIVER_ACCEPTED = 'driver_accepted',
  DRIVER_ARRIVING = 'driver_arriving',
  ORDER_DELIVERED = 'order_delivered',
  ORDER_CANCELLED = 'order_cancelled',
  NEW_ORDER = 'new_order',
  ORDER_AVAILABLE = 'order_available',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_FAILED = 'payment_failed',
}

// Push notification DTOs
export class PushNotificationDto {
  @ApiProperty({ description: 'FCM device token' })
  @IsString()
  token!: string;

  @ApiProperty({ description: 'Notification title' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Notification body' })
  @IsString()
  body!: string;

  @ApiPropertyOptional({ description: 'Additional data payload' })
  @IsOptional()
  @IsObject()
  data?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class PushNotificationBatchDto {
  @ApiProperty({ description: 'FCM device tokens', type: [String] })
  @IsArray()
  @IsString({ each: true })
  tokens!: string[];

  @ApiProperty({ description: 'Notification title' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Notification body' })
  @IsString()
  body!: string;

  @ApiPropertyOptional({ description: 'Additional data payload' })
  @IsOptional()
  @IsObject()
  data?: Record<string, string>;
}

// Email notification DTOs
export class EmailNotificationDto {
  @ApiProperty({ description: 'Recipient email address' })
  @IsString()
  to!: string;

  @ApiProperty({ description: 'Email subject' })
  @IsString()
  subject!: string;

  @ApiProperty({ description: 'Email body (HTML)' })
  @IsString()
  html!: string;

  @ApiPropertyOptional({ description: 'Plain text body' })
  @IsOptional()
  @IsString()
  text?: string;
}

// Internal notification DTOs (for service-to-service calls)
export class OrderNotificationDto {
  @ApiProperty({ description: 'Order ID' })
  @IsString()
  orderId!: string;

  @ApiProperty({ description: 'Notification event', enum: NotificationEvent })
  @IsEnum(NotificationEvent)
  event!: NotificationEvent;

  @ApiPropertyOptional({ description: 'Additional message' })
  @IsOptional()
  @IsString()
  message?: string;
}

export class UserNotificationDto {
  @ApiProperty({ description: 'User ID' })
  @IsString()
  userId!: string;

  @ApiProperty({ description: 'Notification title' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Notification body' })
  @IsString()
  body!: string;

  @ApiProperty({ description: 'Notification event', enum: NotificationEvent })
  @IsEnum(NotificationEvent)
  event!: NotificationEvent;

  @ApiPropertyOptional({ description: 'Additional data' })
  @IsOptional()
  @IsObject()
  data?: Record<string, string>;
}

// Response DTOs
export class NotificationResponseDto {
  @ApiProperty()
  success!: boolean;

  @ApiPropertyOptional()
  messageId?: string;

  @ApiPropertyOptional()
  error?: string;
}

export class BatchNotificationResponseDto {
  @ApiProperty()
  successCount!: number;

  @ApiProperty()
  failureCount!: number;

  @ApiPropertyOptional({ type: [String] })
  failedTokens?: string[];
}
