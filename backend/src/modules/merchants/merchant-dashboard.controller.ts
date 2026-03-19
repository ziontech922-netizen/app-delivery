import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Auth, CurrentUser } from '../auth/decorators';
import { MerchantDashboardService } from './merchant-dashboard.service';
import {
  UpdateOrderStatusDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateProductDto,
  UpdateProductDto,
} from './dto/merchant-dashboard.dto';

@Controller('merchants/me')
@Auth(UserRole.MERCHANT)
export class MerchantDashboardController {
  constructor(private readonly dashboardService: MerchantDashboardService) {}

  // =============================================
  // DASHBOARD
  // =============================================

  /**
   * GET /api/v1/merchants/me/dashboard
   * Retorna stats do dashboard
   */
  @Get('dashboard')
  async getDashboardStats(@CurrentUser('id') userId: string) {
    return this.dashboardService.getDashboardStats(userId);
  }

  // =============================================
  // ORDERS
  // =============================================

  /**
   * GET /api/v1/merchants/me/orders
   * Lista pedidos do merchant
   */
  @Get('orders')
  async getOrders(
    @CurrentUser('id') userId: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.dashboardService.getOrders(userId, {
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  /**
   * GET /api/v1/merchants/me/orders/:id
   * Busca pedido por ID
   */
  @Get('orders/:id')
  async getOrderById(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) orderId: string,
  ) {
    return this.dashboardService.getOrderById(userId, orderId);
  }

  /**
   * POST /api/v1/merchants/me/orders/:id/accept
   * Aceita pedido
   */
  @Post('orders/:id/accept')
  async acceptOrder(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body() body: { estimatedTime?: number },
  ) {
    return this.dashboardService.acceptOrder(userId, orderId, body.estimatedTime);
  }

  /**
   * POST /api/v1/merchants/me/orders/:id/reject
   * Rejeita pedido
   */
  @Post('orders/:id/reject')
  async rejectOrder(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body() body: { reason: string },
  ) {
    return this.dashboardService.rejectOrder(userId, orderId, body.reason);
  }

  /**
   * POST /api/v1/merchants/me/orders/:id/preparing
   * Marca como preparando
   */
  @Post('orders/:id/preparing')
  async markPreparing(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) orderId: string,
  ) {
    return this.dashboardService.updateOrderStatus(userId, orderId, 'PREPARING');
  }

  /**
   * POST /api/v1/merchants/me/orders/:id/ready
   * Marca como pronto
   */
  @Post('orders/:id/ready')
  async markReady(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) orderId: string,
  ) {
    return this.dashboardService.updateOrderStatus(userId, orderId, 'READY');
  }

  // =============================================
  // PRODUCTS
  // =============================================

  /**
   * GET /api/v1/merchants/me/products
   * Lista produtos do merchant
   */
  @Get('products')
  async getProducts(
    @CurrentUser('id') userId: string,
    @Query('categoryId') categoryId?: string,
    @Query('isAvailable') isAvailable?: string,
    @Query('search') search?: string,
  ) {
    return this.dashboardService.getProducts(userId, {
      categoryId,
      isAvailable: isAvailable === 'true' ? true : isAvailable === 'false' ? false : undefined,
      search,
    });
  }

  /**
   * POST /api/v1/merchants/me/products
   * Cria produto
   */
  @Post('products')
  async createProduct(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.dashboardService.createProduct(userId, dto);
  }

  /**
   * PATCH /api/v1/merchants/me/products/:id
   * Atualiza produto
   */
  @Patch('products/:id')
  async updateProduct(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) productId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.dashboardService.updateProduct(userId, productId, dto);
  }

  /**
   * DELETE /api/v1/merchants/me/products/:id
   * Remove produto
   */
  @Delete('products/:id')
  async deleteProduct(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) productId: string,
  ) {
    return this.dashboardService.deleteProduct(userId, productId);
  }

  // =============================================
  // CATEGORIES
  // =============================================

  /**
   * GET /api/v1/merchants/me/categories
   * Lista categorias do merchant
   */
  @Get('categories')
  async getCategories(@CurrentUser('id') userId: string) {
    return this.dashboardService.getCategories(userId);
  }

  /**
   * POST /api/v1/merchants/me/categories
   * Cria categoria
   */
  @Post('categories')
  async createCategory(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.dashboardService.createCategory(userId, dto);
  }

  /**
   * PATCH /api/v1/merchants/me/categories/:id
   * Atualiza categoria
   */
  @Patch('categories/:id')
  async updateCategory(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) categoryId: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.dashboardService.updateCategory(userId, categoryId, dto);
  }

  /**
   * DELETE /api/v1/merchants/me/categories/:id
   * Remove categoria
   */
  @Delete('categories/:id')
  async deleteCategory(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) categoryId: string,
  ) {
    return this.dashboardService.deleteCategory(userId, categoryId);
  }

  // =============================================
  // ANALYTICS
  // =============================================

  /**
   * GET /api/v1/merchants/me/analytics
   * Retorna analytics do merchant
   */
  @Get('analytics')
  async getAnalytics(
    @CurrentUser('id') userId: string,
    @Query('period') period?: string,
  ) {
    return this.dashboardService.getAnalytics(userId, period || 'month');
  }

  // =============================================
  // REVIEWS
  // =============================================

  /**
   * GET /api/v1/merchants/me/reviews
   * Lista reviews do merchant
   */
  @Get('reviews')
  async getReviews(
    @CurrentUser('id') userId: string,
    @Query('rating') rating?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.dashboardService.getReviews(userId, {
      rating: rating ? parseInt(rating, 10) : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  /**
   * POST /api/v1/merchants/me/reviews/:id/reply
   * Responde a uma review
   */
  @Post('reviews/:id/reply')
  async replyToReview(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) reviewId: string,
    @Body() body: { reply: string },
  ) {
    return this.dashboardService.replyToReview(userId, reviewId, body.reply);
  }
}
