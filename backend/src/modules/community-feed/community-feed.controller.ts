import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '@modules/auth/guards/optional-jwt-auth.guard';
import { CommunityFeedService } from './community-feed.service';
import { FeedQueryDto } from './dto/feed-query.dto';
import { CreateFeedItemDto } from './dto/create-feed-item.dto';

interface AuthenticatedRequest {
  user?: { id: string; email: string };
}

@ApiTags('community-feed')
@Controller('feed')
export class CommunityFeedController {
  constructor(private readonly feedService: CommunityFeedService) {}

  // =============================================
  // PUBLIC ENDPOINTS
  // =============================================

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Obter feed da comunidade' })
  @ApiResponse({ status: 200, description: 'Feed da comunidade' })
  getFeed(@Request() req: AuthenticatedRequest, @Query() query: FeedQueryDto) {
    if (req.user?.id) {
      return this.feedService.getPersonalizedFeed(req.user.id, query);
    }
    return this.feedService.getFeed(query);
  }

  @Get('personalized')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter feed personalizado' })
  @ApiResponse({ status: 200, description: 'Feed personalizado' })
  getPersonalizedFeed(@Request() req: AuthenticatedRequest, @Query() query: FeedQueryDto) {
    return this.feedService.getPersonalizedFeed(req.user!.id, query);
  }

  // =============================================
  // ADMIN ENDPOINTS
  // =============================================

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar item no feed (admin)' })
  @ApiResponse({ status: 201, description: 'Item criado' })
  create(@Body() dto: CreateFeedItemDto) {
    return this.feedService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar item do feed (admin)' })
  @ApiResponse({ status: 200, description: 'Item atualizado' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateFeedItemDto>) {
    return this.feedService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover item do feed (admin)' })
  @ApiResponse({ status: 200, description: 'Item removido' })
  remove(@Param('id') id: string) {
    return this.feedService.remove(id);
  }
}
