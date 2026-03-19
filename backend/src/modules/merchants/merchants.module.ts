import { Module } from '@nestjs/common';
import { MerchantsController } from './merchants.controller';
import { MerchantsService } from './merchants.service';
import { MerchantDashboardController } from './merchant-dashboard.controller';
import { MerchantDashboardService } from './merchant-dashboard.service';

@Module({
  controllers: [MerchantsController, MerchantDashboardController],
  providers: [MerchantsService, MerchantDashboardService],
  exports: [MerchantsService, MerchantDashboardService],
})
export class MerchantsModule {}
