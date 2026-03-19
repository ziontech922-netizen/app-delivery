import { Module } from '@nestjs/common';
import { CommunityFeedController } from './community-feed.controller';
import { CommunityFeedService } from './community-feed.service';
import { PrismaModule } from '@shared/prisma';

@Module({
  imports: [PrismaModule],
  controllers: [CommunityFeedController],
  providers: [CommunityFeedService],
  exports: [CommunityFeedService],
})
export class CommunityFeedModule {}
