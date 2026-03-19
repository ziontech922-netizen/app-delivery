import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { MercadoPagoService } from './mercadopago.service';
import { PrismaModule } from '@shared/prisma';
import { OrdersModule } from '@modules/orders/orders.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    forwardRef(() => OrdersModule),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, MercadoPagoService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
