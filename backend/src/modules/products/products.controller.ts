import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ProductsService } from './products.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateProductDto,
  UpdateProductDto,
} from './dto';
import { Auth, CurrentUser } from '../auth/decorators';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // =============================================
  // ROTAS PÚBLICAS
  // =============================================

  /**
   * GET /api/v1/products/merchant/:merchantId
   * Lista produtos de um merchant (público)
   */
  @Get('merchant/:merchantId')
  async findByMerchant(@Param('merchantId') merchantId: string) {
    return this.productsService.findProductsByMerchant(merchantId);
  }

  // =============================================
  // CATEGORIAS (merchant)
  // =============================================

  /**
   * POST /api/v1/products/categories
   * Cria categoria
   */
  @Post('categories')
  @Auth(UserRole.MERCHANT)
  async createCategory(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.productsService.createCategory(userId, dto);
  }

  /**
   * GET /api/v1/products/categories
   * Lista categorias do merchant
   */
  @Get('categories')
  @Auth(UserRole.MERCHANT)
  async findCategories(@CurrentUser('id') userId: string) {
    return this.productsService.findCategories(userId);
  }

  /**
   * PATCH /api/v1/products/categories/:id
   * Atualiza categoria
   */
  @Patch('categories/:id')
  @Auth(UserRole.MERCHANT)
  async updateCategory(
    @CurrentUser('id') userId: string,
    @Param('id') categoryId: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.productsService.updateCategory(userId, categoryId, dto);
  }

  /**
   * DELETE /api/v1/products/categories/:id
   * Remove categoria
   */
  @Delete('categories/:id')
  @Auth(UserRole.MERCHANT)
  async deleteCategory(
    @CurrentUser('id') userId: string,
    @Param('id') categoryId: string,
  ) {
    return this.productsService.deleteCategory(userId, categoryId);
  }

  // =============================================
  // PRODUTOS (merchant)
  // =============================================

  /**
   * POST /api/v1/products
   * Cria produto
   */
  @Post()
  @Auth(UserRole.MERCHANT)
  async createProduct(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.createProduct(userId, dto);
  }

  /**
   * GET /api/v1/products
   * Lista produtos do merchant
   */
  @Get()
  @Auth(UserRole.MERCHANT)
  async findProducts(
    @CurrentUser('id') userId: string,
    @Query('categoryId') categoryId?: string,
    @Query('isAvailable') isAvailable?: boolean,
  ) {
    return this.productsService.findProducts(userId, { categoryId, isAvailable });
  }

  /**
   * GET /api/v1/products/:id
   * Busca produto por ID
   */
  @Get(':id')
  @Auth(UserRole.MERCHANT)
  async findProductById(
    @CurrentUser('id') userId: string,
    @Param('id') productId: string,
  ) {
    return this.productsService.findProductById(userId, productId);
  }

  /**
   * PATCH /api/v1/products/:id
   * Atualiza produto
   */
  @Patch(':id')
  @Auth(UserRole.MERCHANT)
  async updateProduct(
    @CurrentUser('id') userId: string,
    @Param('id') productId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.updateProduct(userId, productId, dto);
  }

  /**
   * DELETE /api/v1/products/:id
   * Remove produto
   */
  @Delete(':id')
  @Auth(UserRole.MERCHANT)
  async deleteProduct(
    @CurrentUser('id') userId: string,
    @Param('id') productId: string,
  ) {
    return this.productsService.deleteProduct(userId, productId);
  }

  /**
   * POST /api/v1/products/:id/toggle-availability
   * Toggle disponibilidade
   */
  @Post(':id/toggle-availability')
  @Auth(UserRole.MERCHANT)
  async toggleAvailability(
    @CurrentUser('id') userId: string,
    @Param('id') productId: string,
  ) {
    return this.productsService.toggleAvailability(userId, productId);
  }
}
