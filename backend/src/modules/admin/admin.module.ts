import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '@shared/prisma';
import { PaymentsModule } from '@modules/payments/payments.module';

@Module({
  imports: [
    PrismaModule,
    PaymentsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
