import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { EtaService } from './eta.service';
import { CalculateEtaDto } from './dto/eta.dto';

@Controller('eta')
export class EtaController {
  constructor(private readonly etaService: EtaService) {}

  // =============================================
  // PUBLIC ENDPOINTS (para listagem)
  // =============================================

  /**
   * Calcula ETA para um merchant específico
   * Usado na tela de detalhes do restaurante
   */
  @Get('merchant/:merchantId')
  async getMerchantEta(
    @Param('merchantId') merchantId: string,
    @Query('lat') lat: string,
    @Query('lng') lng: string,
  ) {
    const result = await this.etaService.calculateMerchantEta(
      merchantId,
      Number(lat),
      Number(lng),
    );

    return {
      ...result,
      displayTime: this.etaService.formatEtaRange(
        result.deliveryRange.min,
        result.deliveryRange.max,
      ),
    };
  }

  /**
   * Calcula ETA para múltiplos merchants
   * Usado na listagem de restaurantes
   */
  @Post('merchants/bulk')
  async getBulkMerchantEta(
    @Body() body: { merchantIds: string[]; lat: number; lng: number },
  ) {
    const results = await this.etaService.calculateBulkMerchantEta(
      body.merchantIds,
      body.lat,
      body.lng,
    );

    return results.map((r) => ({
      ...r,
      displayTime: this.etaService.formatEtaRange(
        r.deliveryRange.min,
        r.deliveryRange.max,
      ),
    }));
  }

  // =============================================
  // AUTHENTICATED ENDPOINTS
  // =============================================

  /**
   * Calcula ETA completo para uma entrega
   * Usado antes de confirmar pedido
   */
  @Post('calculate')
  @UseGuards(JwtAuthGuard)
  async calculateEta(@Body() dto: CalculateEtaDto) {
    const result = await this.etaService.calculateEta(dto);

    return {
      ...result,
      displayTime: this.etaService.formatEtaRange(
        result.breakdown.totalRange.min,
        result.breakdown.totalRange.max,
      ),
      displayTotal: this.etaService.formatEtaDisplay(result.estimatedDeliveryMinutes),
    };
  }

  /**
   * Obtém ETA atualizado para um pedido
   * Usado na tela de tracking
   */
  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  async getOrderEta(@Param('orderId') orderId: string) {
    const result = await this.etaService.calculateOrderEta(orderId);

    return {
      ...result,
      displayRemaining: result.remainingMinutes
        ? this.etaService.formatEtaDisplay(result.remainingMinutes)
        : null,
    };
  }

  // =============================================
  // UTILITY ENDPOINTS
  // =============================================

  /**
   * Calcula distância entre dois pontos
   */
  @Get('distance')
  async calculateDistance(
    @Query('lat1') lat1: string,
    @Query('lng1') lng1: string,
    @Query('lat2') lat2: string,
    @Query('lng2') lng2: string,
  ) {
    const distance = this.etaService.calculateHaversineDistance(
      Number(lat1),
      Number(lng1),
      Number(lat2),
      Number(lng2),
    );

    return {
      distanceKm: distance,
      distanceMeters: Math.round(distance * 1000),
    };
  }
}
