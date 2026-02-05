import { Module, forwardRef } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaModule } from '@shared/prisma';
import { RealtimeModule } from '@modules/realtime/realtime.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => RealtimeModule),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
