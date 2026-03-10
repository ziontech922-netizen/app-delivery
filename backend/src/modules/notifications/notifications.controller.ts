import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import {
  PushNotificationDto,
  PushNotificationBatchDto,
  EmailNotificationDto,
  NotificationResponseDto,
  BatchNotificationResponseDto,
} from './dto/notification.dto';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('push')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a push notification (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Push notification sent',
    type: NotificationResponseDto,
  })
  async sendPushNotification(
    @Body() dto: PushNotificationDto,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.sendPushNotification(dto);
  }

  @Post('push/batch')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send push notifications to multiple devices (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Batch push notifications result',
    type: BatchNotificationResponseDto,
  })
  async sendPushNotificationBatch(
    @Body() dto: PushNotificationBatchDto,
  ): Promise<BatchNotificationResponseDto> {
    return this.notificationsService.sendPushNotificationBatch(dto);
  }

  @Post('email')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send an email notification (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Email sent',
    type: NotificationResponseDto,
  })
  async sendEmail(
    @Body() dto: EmailNotificationDto,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.sendEmail(dto);
  }
}
