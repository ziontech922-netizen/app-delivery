import { Module } from '@nestjs/common';
import { PrismaModule } from '@shared/prisma/prisma.module';
import { PlatformFeeService } from './platform-fee.service';
import { PlatformFeeController } from './platform-fee.controller';

@Module({
  imports: [PrismaModule],
  controllers: [PlatformFeeController],
  providers: [PlatformFeeService],
  exports: [PlatformFeeService],
})
export class PlatformFeeModule {}
