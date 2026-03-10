import { Module, forwardRef } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaModule } from '@shared/prisma';
import { RealtimeModule } from '@modules/realtime/realtime.module';
import { PaymentsModule } from '@modules/payments/payments.module';
import { CouponsModule } from '@modules/coupons/coupons.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => RealtimeModule),
    forwardRef(() => PaymentsModule),
    forwardRef(() => CouponsModule),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
