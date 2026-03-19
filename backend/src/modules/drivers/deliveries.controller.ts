import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IsString, IsOptional, IsIn } from 'class-validator';
import { DriversService } from './drivers.service';
import { Auth, CurrentUser } from '@modules/auth/decorators';
import { UserRole } from '@prisma/client';
import { DriverOrdersQueryDto } from './dto';

// DTO for status update
class UpdateDeliveryStatusDto {
  @IsIn(['PICKED_UP', 'DELIVERED'])
  status!: 'PICKED_UP' | 'DELIVERED';

  @IsOptional()
  @IsString()
  signature?: string;

  @IsOptional()
  @IsString()
  photo?: string;
}

// DTO for cancel
class CancelDeliveryDto {
  @IsString()
  reason!: string;
}

@Controller('deliveries')
export class DeliveriesController {
  constructor(private readonly driversService: DriversService) {}

  // ===========================================
  // AVAILABLE ORDERS
  // ===========================================

  @Get('available')
  @Auth(UserRole.DRIVER)
  getAvailableDeliveries(
    @CurrentUser('sub') userId: string,
    @Query() query: DriverOrdersQueryDto,
  ) {
    return this.driversService.getAvailableOrders(userId, query);
  }

  // ===========================================
  // CURRENT DELIVERY
  // ===========================================

  @Get('current')
  @Auth(UserRole.DRIVER)
  async getCurrentDelivery(@CurrentUser('sub') userId: string) {
    const current = await this.driversService.getCurrentDelivery(userId);
    return current || null;
  }

  // ===========================================
  // DELIVERY HISTORY
  // ===========================================

  @Get('history')
  @Auth(UserRole.DRIVER)
  getDeliveryHistory(
    @CurrentUser('sub') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.driversService.getDeliveryHistory(
      userId,
      startDate,
      endDate,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  // ===========================================
  // ACCEPT ORDER
  // ===========================================

  @Post(':id/accept')
  @Auth(UserRole.DRIVER)
  @HttpCode(HttpStatus.OK)
  acceptDelivery(
    @CurrentUser('sub') userId: string,
    @Param('id') orderId: string,
  ) {
    return this.driversService.acceptOrder(userId, { orderId });
  }

  // ===========================================
  // UPDATE DELIVERY STATUS
  // ===========================================

  @Patch(':id/status')
  @Auth(UserRole.DRIVER)
  @HttpCode(HttpStatus.OK)
  updateDeliveryStatus(
    @CurrentUser('sub') userId: string,
    @Param('id') orderId: string,
    @Body() dto: UpdateDeliveryStatusDto,
  ) {
    if (dto.status === 'DELIVERED') {
      return this.driversService.completeDelivery(userId, {
        orderId,
      });
    }
    // For PICKED_UP status
    return this.driversService.updateDeliveryStatus(userId, orderId, dto.status);
  }

  // ===========================================
  // CANCEL DELIVERY
  // ===========================================

  @Post(':id/cancel')
  @Auth(UserRole.DRIVER)
  @HttpCode(HttpStatus.OK)
  cancelDelivery(
    @CurrentUser('sub') userId: string,
    @Param('id') orderId: string,
    @Body() dto: CancelDeliveryDto,
  ) {
    return this.driversService.cancelDelivery(userId, orderId, dto.reason);
  }
}
