import { Module } from '@nestjs/common';
import { EtaController } from './eta.controller';
import { EtaService } from './eta.service';
import { PrismaModule } from '@shared/prisma/prisma.module';
import { RedisModule } from '@shared/redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [EtaController],
  providers: [EtaService],
  exports: [EtaService],
})
export class EtaModule {}
