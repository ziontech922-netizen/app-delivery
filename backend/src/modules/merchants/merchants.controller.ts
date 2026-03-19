import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { UserRole, MerchantStatus } from '@prisma/client';
import { MerchantsService } from './merchants.service';
import { CreateMerchantDto, UpdateMerchantDto } from './dto';
import { Auth, CurrentUser } from '../auth/decorators';

@Controller('merchants')
export class MerchantsController {
  constructor(private readonly merchantsService: MerchantsService) {}

  // =============================================
  // ROTAS PÚBLICAS (para customers)
  // =============================================

  /**
   * GET /api/v1/merchants
   * Lista merchants ativos (público)
   */
  @Get()
  async findAllActive(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('city') city?: string,
    @Query('search') search?: string,
  ) {
    return this.merchantsService.findAllActive({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      city,
      search,
    });
  }

  /**
   * GET /api/v1/merchants/:id
   * Busca merchant por ID com produtos (público)
   */
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.merchantsService.findById(id);
  }

  // =============================================
  // ROTAS DO MERCHANT (owner)
  // =============================================

  /**
   * POST /api/v1/merchants
   * Cria merchant para o usuário autenticado
   */
  @Post()
  @Auth()
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateMerchantDto) {
    return this.merchantsService.create(userId, dto);
  }

  /**
   * GET /api/v1/merchants/me
   * Retorna merchant do usuário autenticado
   */
  @Get('me')
  @Auth(UserRole.MERCHANT)
  async findMyMerchant(@CurrentUser('id') userId: string) {
    return this.merchantsService.findMyMerchant(userId);
  }

  /**
   * PATCH /api/v1/merchants/me
   * Atualiza merchant do usuário autenticado
   */
  @Patch('me')
  @Auth(UserRole.MERCHANT)
  async update(@CurrentUser('id') userId: string, @Body() dto: UpdateMerchantDto) {
    return this.merchantsService.update(userId, dto);
  }

  /**
   * POST /api/v1/merchants/me/toggle-open
   * Alterna aberto/fechado
   */
  @Post('me/toggle-open')
  @Auth(UserRole.MERCHANT)
  async toggleOpen(@CurrentUser('id') userId: string) {
    return this.merchantsService.toggleOpen(userId);
  }

  // =============================================
  // ROTAS ADMIN
  // =============================================

  /**
   * GET /api/v1/merchants/admin/all
   * Lista todos os merchants (admin)
   */
  @Get('admin/all')
  @Auth(UserRole.ADMIN)
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: MerchantStatus,
  ) {
    return this.merchantsService.findAll({ page, limit, status });
  }

  /**
   * POST /api/v1/merchants/admin/:id/approve
   * Aprova merchant (admin)
   */
  @Post('admin/:id/approve')
  @Auth(UserRole.ADMIN)
  async approve(@Param('id') id: string) {
    return this.merchantsService.approve(id);
  }
}
