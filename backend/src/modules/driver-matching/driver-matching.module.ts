import { Module, forwardRef } from '@nestjs/common';
import { DriverMatchingService } from './driver-matching.service';
import { DriverMatchingController } from './driver-matching.controller';
import { PrismaModule } from '@shared/prisma/prisma.module';
import { RedisModule } from '@shared/redis/redis.module';
import { RealtimeModule } from '@modules/realtime/realtime.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    forwardRef(() => RealtimeModule),
  ],
  controllers: [DriverMatchingController],
  providers: [DriverMatchingService],
  exports: [DriverMatchingService],
})
export class DriverMatchingModule {}
