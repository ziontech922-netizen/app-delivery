import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { SmsService } from './sms.service';
import { EmailService } from './email.service';
import { PrismaModule } from '@shared/prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, SmsService, EmailService],
  exports: [NotificationsService, SmsService, EmailService],
})
export class NotificationsModule {}
