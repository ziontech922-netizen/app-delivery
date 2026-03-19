import { Module } from '@nestjs/common';
import { DriversController } from './drivers.controller';
import { DeliveriesController } from './deliveries.controller';
import { DriversService } from './drivers.service';
import { PrismaModule } from '@shared/prisma';
import { RedisModule } from '@shared/redis';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
  ],
  controllers: [DriversController, DeliveriesController],
  providers: [DriversService],
  exports: [DriversService],
})
export class DriversModule {}
