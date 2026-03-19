import { Module } from '@nestjs/common';
import { AiListingController } from './ai-listing.controller';
import { AiListingService } from './ai-listing.service';
import { ListingsModule } from '@modules/listings/listings.module';
import { PrismaModule } from '@shared/prisma';

@Module({
  imports: [PrismaModule, ListingsModule],
  controllers: [AiListingController],
  providers: [AiListingService],
  exports: [AiListingService],
})
export class AiListingModule {}
