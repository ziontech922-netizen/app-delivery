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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { SponsorsService } from './sponsors.service';
import { CreateSponsorDto, UpdateSponsorDto, SponsorPlacement } from './dto/create-sponsor.dto';
import { SponsorQueryDto } from './dto/sponsor-query.dto';

@ApiTags('sponsors')
@Controller('sponsors')
export class SponsorsController {
  constructor(private readonly sponsorsService: SponsorsService) {}

  // =============================================
  // PUBLIC ENDPOINTS
  // =============================================

  @Get('placement/:placement')
  @ApiOperation({ summary: 'Obter patrocinadores por posição' })
  @ApiResponse({ status: 200, description: 'Patrocinadores para a posição' })
  getForPlacement(
    @Param('placement') placement: SponsorPlacement,
    @Query('city') city?: string,
    @Query('category') category?: string,
  ) {
    return this.sponsorsService.getForPlacement(placement, city, category);
  }

  @Post(':id/click')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrar clique em patrocinador' })
  @ApiResponse({ status: 200, description: 'Clique registrado' })
  recordClick(@Param('id') id: string) {
    return this.sponsorsService.recordClick(id);
  }

  // =============================================
  // ADMIN ENDPOINTS
  // =============================================

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar patrocinadores (admin)' })
  @ApiResponse({ status: 200, description: 'Lista de patrocinadores' })
  findAll(@Query() query: SponsorQueryDto) {
    return this.sponsorsService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter patrocinador por ID' })
  @ApiResponse({ status: 200, description: 'Detalhes do patrocinador' })
  findOne(@Param('id') id: string) {
    return this.sponsorsService.findOne(id);
  }

  @Get(':id/metrics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter métricas do patrocinador' })
  @ApiResponse({ status: 200, description: 'Métricas do patrocinador' })
  getMetrics(@Param('id') id: string) {
    return this.sponsorsService.getMetrics(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar patrocinador' })
  @ApiResponse({ status: 201, description: 'Patrocinador criado' })
  create(@Body() dto: CreateSponsorDto) {
    return this.sponsorsService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar patrocinador' })
  @ApiResponse({ status: 200, description: 'Patrocinador atualizado' })
  update(@Param('id') id: string, @Body() dto: UpdateSponsorDto) {
    return this.sponsorsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover patrocinador' })
  @ApiResponse({ status: 204, description: 'Patrocinador removido' })
  remove(@Param('id') id: string) {
    return this.sponsorsService.remove(id);
  }
}
