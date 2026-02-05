import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserRole, OrderStatus } from '@prisma/client';
import { Auth, CurrentUser } from '@modules/auth/decorators';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, CreateAddressDto } from './dto';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // =============================================
  // ADDRESSES (CUSTOMER)
  // =============================================

  @Post('addresses')
  @Auth(UserRole.CUSTOMER)
  async createAddress(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateAddressDto,
  ) {
    return this.ordersService.createAddress(userId, dto);
  }

  @Get('addresses')
  @Auth(UserRole.CUSTOMER)
  async listAddresses(@CurrentUser('id') userId: string) {
    return this.ordersService.findAddresses(userId);
  }

  // =============================================
  // ORDERS - CUSTOMER
  // =============================================

  @Post('orders')
  @Auth(UserRole.CUSTOMER)
  @HttpCode(HttpStatus.CREATED)
  async createOrder(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(userId, dto);
  }

  @Get('orders')
  @Auth(UserRole.CUSTOMER)
  async listCustomerOrders(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: OrderStatus,
  ) {
    return this.ordersService.findCustomerOrders(userId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      status,
    });
  }

  @Get('orders/:id')
  @Auth(UserRole.CUSTOMER)
  async getCustomerOrder(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ordersService.findCustomerOrderById(userId, id);
  }

  // =============================================
  // ORDERS - MERCHANT
  // =============================================

  @Get('merchant/orders')
  @Auth(UserRole.MERCHANT)
  async listMerchantOrders(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: OrderStatus,
  ) {
    return this.ordersService.findMerchantOrders(userId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      status,
    });
  }

  @Get('merchant/orders/pending')
  @Auth(UserRole.MERCHANT)
  async listPendingOrders(@CurrentUser('id') userId: string) {
    return this.ordersService.findPendingOrders(userId);
  }

  @Get('merchant/orders/:id')
  @Auth(UserRole.MERCHANT)
  async getMerchantOrder(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ordersService.findMerchantOrderById(userId, id);
  }

  @Patch('merchant/orders/:id/status')
  @Auth(UserRole.MERCHANT)
  async updateOrderStatus(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(userId, id, dto);
  }
}
