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
} from '@nestjs/common';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { PlatformFeeService } from './platform-fee.service';
import { CreatePlatformFeeDto, UpdatePlatformFeeDto } from './dto/platform-fee.dto';

@Controller('platform-fees')
export class PlatformFeeController {
  constructor(private readonly platformFeeService: PlatformFeeService) {}

  // =============================================
  // ADMIN ENDPOINTS
  // =============================================

  /**
   * Cria nova taxa (ADMIN only)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async create(@Body() dto: CreatePlatformFeeDto) {
    return this.platformFeeService.create(dto);
  }

  /**
   * Lista todas as taxas (ADMIN only)
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async findAll(
    @Query('isActive') isActive?: string,
    @Query('merchantId') merchantId?: string,
  ) {
    return this.platformFeeService.findAll({
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      merchantId,
    });
  }

  /**
   * Busca taxa por ID (ADMIN only)
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async findById(@Param('id') id: string) {
    return this.platformFeeService.findById(id);
  }

  /**
   * Atualiza taxa (ADMIN only)
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async update(@Param('id') id: string, @Body() dto: UpdatePlatformFeeDto) {
    return this.platformFeeService.update(id, dto);
  }

  /**
   * Desativa taxa (soft delete) (ADMIN only)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async delete(@Param('id') id: string) {
    await this.platformFeeService.delete(id);
    return { message: 'Taxa desativada com sucesso' };
  }

  /**
   * Remove taxa permanentemente (ADMIN only)
   */
  @Delete(':id/permanent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async hardDelete(@Param('id') id: string) {
    await this.platformFeeService.hardDelete(id);
    return { message: 'Taxa removida permanentemente' };
  }

  // =============================================
  // PUBLIC / CALCULATION ENDPOINTS
  // =============================================

  /**
   * Preview das taxas para um pedido
   * Usado no checkout antes de confirmar
   */
  @Get('preview/:merchantId')
  async previewFees(
    @Param('merchantId') merchantId: string,
    @Query('subtotal') subtotal: string,
    @Query('deliveryFee') deliveryFee: string,
    @Query('discount') discount?: string,
  ) {
    return this.platformFeeService.previewOrderFees({
      merchantId,
      subtotal: Number(subtotal),
      merchantDeliveryFee: Number(deliveryFee),
      discount: discount ? Number(discount) : 0,
    });
  }

  /**
   * Busca taxa aplicável para um merchant
   * Usado internamente e para consultas
   */
  @Get('applicable/:merchantId')
  async getApplicableFee(@Param('merchantId') merchantId: string) {
    const fee = await this.platformFeeService.getApplicableFee(merchantId);
    return fee || { message: 'Nenhuma taxa aplicável' };
  }
}
