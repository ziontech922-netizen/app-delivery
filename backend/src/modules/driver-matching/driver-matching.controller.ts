import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { DriverMatchingService } from './driver-matching.service';
import {
  FindNearbyDriversDto,
  MatchDriverForOrderDto,
} from './dto/find-drivers.dto';
import { RespondToOfferDto } from './dto/delivery-offer.dto';

@Controller('driver-matching')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DriverMatchingController {
  constructor(private readonly driverMatchingService: DriverMatchingService) {}

  // ===========================================
  // ADMIN ENDPOINTS
  // ===========================================

  /**
   * Busca drivers próximos a uma localização (admin/teste)
   */
  @Get('nearby-drivers')
  @Roles('ADMIN')
  async findNearbyDrivers(@Query() query: FindNearbyDriversDto) {
    const drivers = await this.driverMatchingService.findNearbyDrivers({
      latitude: Number(query.latitude),
      longitude: Number(query.longitude),
      radiusKm: query.radiusKm ? Number(query.radiusKm) : undefined,
      vehicleType: query.vehicleType,
      limit: query.limit ? Number(query.limit) : undefined,
    });

    return {
      count: drivers.length,
      drivers,
    };
  }

  /**
   * Inicia matching manual para um pedido (admin)
   */
  @Post('orders/:orderId/start')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async startMatching(
    @Param('orderId') orderId: string,
    @Body() dto: Partial<MatchDriverForOrderDto>,
  ) {
    const result = await this.driverMatchingService.startMatchingForOrder({
      orderId,
      radiusKm: dto.radiusKm,
      vehicleType: dto.vehicleType,
    });

    return result;
  }

  /**
   * Continua matching após recusa (admin/sistema)
   */
  @Post('orders/:orderId/continue')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async continueMatching(@Param('orderId') orderId: string) {
    return this.driverMatchingService.continueMatchingForOrder(orderId);
  }

  /**
   * Cancela matching ativo (admin)
   */
  @Delete('orders/:orderId')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelMatching(@Param('orderId') orderId: string) {
    await this.driverMatchingService.cancelMatching(orderId);
  }

  /**
   * Obtém estatísticas de matching (admin)
   */
  @Get('stats')
  @Roles('ADMIN')
  async getStats() {
    return this.driverMatchingService.getMatchingStats();
  }

  // ===========================================
  // DRIVER ENDPOINTS
  // ===========================================

  /**
   * Driver obtém sua oferta atual
   */
  @Get('offers/current')
  @Roles('DRIVER')
  async getCurrentOffer(@CurrentUser('id') userId: string) {
    const offer = await this.driverMatchingService.getDriverCurrentOffer(userId);

    if (!offer) {
      return { hasOffer: false, offer: null };
    }

    return { hasOffer: true, offer };
  }

  /**
   * Driver responde a uma oferta
   */
  @Post('offers/:offerId/respond')
  @Roles('DRIVER')
  @HttpCode(HttpStatus.OK)
  async respondToOffer(
    @CurrentUser('id') userId: string,
    @Param('offerId') offerId: string,
    @Body() dto: Omit<RespondToOfferDto, 'offerId'>,
  ) {
    const result = await this.driverMatchingService.respondToOffer(userId, {
      offerId,
      ...dto,
    });

    // Se recusou, continuar matching automaticamente
    if (!dto.accepted && !result.success) {
      // O processo de continuar o matching seria feito em background
      // ou via WebSocket/eventos
    }

    return result;
  }

  // ===========================================
  // INTERNAL/WEBHOOK ENDPOINTS
  // ===========================================

  /**
   * Calcula distância entre dois pontos (utilitário)
   */
  @Get('calculate-distance')
  async calculateDistance(
    @Query('lat1') lat1: string,
    @Query('lng1') lng1: string,
    @Query('lat2') lat2: string,
    @Query('lng2') lng2: string,
  ) {
    const distance = this.driverMatchingService.calculateHaversineDistance(
      Number(lat1),
      Number(lng1),
      Number(lat2),
      Number(lng2),
    );

    const estimatedTime = this.driverMatchingService.estimateTravelTime(distance);

    return {
      distanceKm: distance,
      estimatedTimeMinutes: estimatedTime,
    };
  }
}
