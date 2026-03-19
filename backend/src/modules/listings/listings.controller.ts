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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '@modules/auth/guards/optional-jwt-auth.guard';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { ListingQueryDto } from './dto/listing-query.dto';

interface AuthenticatedRequest {
  user: { id: string; email: string };
}

@ApiTags('listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  // =============================================
  // PUBLIC ENDPOINTS
  // =============================================

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Listar anúncios' })
  @ApiResponse({ status: 200, description: 'Lista de anúncios' })
  findAll(@Query() query: ListingQueryDto) {
    return this.listingsService.findAll(query);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Listar categorias com contagem' })
  @ApiResponse({ status: 200, description: 'Lista de categorias' })
  getCategories() {
    return this.listingsService.getCategories();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas de anúncios' })
  @ApiResponse({ status: 200, description: 'Estatísticas' })
  getStats(@Query('city') city?: string) {
    return this.listingsService.getStats(city);
  }

  @Get('user/:userHandle')
  @ApiOperation({ summary: 'Listar anúncios de um usuário por handle' })
  @ApiResponse({ status: 200, description: 'Lista de anúncios do usuário' })
  findByUserHandle(
    @Param('userHandle') userHandle: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.listingsService.findByUserHandle(userHandle, page, limit);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Obter detalhes de um anúncio' })
  @ApiResponse({ status: 200, description: 'Detalhes do anúncio' })
  @ApiResponse({ status: 404, description: 'Anúncio não encontrado' })
  findOne(@Param('id') id: string) {
    return this.listingsService.findOne(id, true);
  }

  // =============================================
  // AUTHENTICATED ENDPOINTS
  // =============================================

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar novo anúncio' })
  @ApiResponse({ status: 201, description: 'Anúncio criado' })
  create(@Request() req: AuthenticatedRequest, @Body() dto: CreateListingDto) {
    return this.listingsService.create(req.user.id, dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar anúncio' })
  @ApiResponse({ status: 200, description: 'Anúncio atualizado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Anúncio não encontrado' })
  update(@Request() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateListingDto) {
    return this.listingsService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover anúncio' })
  @ApiResponse({ status: 204, description: 'Anúncio removido' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Anúncio não encontrado' })
  remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.listingsService.remove(id, req.user.id);
  }

  // =============================================
  // FAVORITES
  // =============================================

  @Get('favorites/my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar meus favoritos' })
  @ApiResponse({ status: 200, description: 'Lista de favoritos' })
  getMyFavorites(
    @Request() req: AuthenticatedRequest,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.listingsService.getUserFavorites(req.user.id, page, limit);
  }

  @Post(':id/favorite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Adicionar aos favoritos' })
  @ApiResponse({ status: 200, description: 'Adicionado aos favoritos' })
  addFavorite(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.listingsService.addFavorite(id, req.user.id);
  }

  @Delete(':id/favorite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover dos favoritos' })
  @ApiResponse({ status: 200, description: 'Removido dos favoritos' })
  removeFavorite(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.listingsService.removeFavorite(id, req.user.id);
  }
}
