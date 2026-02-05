import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@shared/prisma';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateProductDto,
  UpdateProductDto,
} from './dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // =============================================
  // CATEGORIES
  // =============================================

  /**
   * Cria categoria para o merchant do usuário
   */
  async createCategory(userId: string, dto: CreateCategoryDto) {
    const merchant = await this.getMerchantByUserId(userId);

    const category = await this.prisma.category.create({
      data: {
        merchantId: merchant.id,
        name: dto.name,
        description: dto.description,
        sortOrder: dto.sortOrder ?? 0,
      },
    });

    this.logger.log(`Categoria criada: ${category.id}`);

    return category;
  }

  /**
   * Lista categorias do merchant
   */
  async findCategories(userId: string) {
    const merchant = await this.getMerchantByUserId(userId);

    return this.prisma.category.findMany({
      where: { merchantId: merchant.id },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { products: true } },
      },
    });
  }

  /**
   * Atualiza categoria
   */
  async updateCategory(userId: string, categoryId: string, dto: UpdateCategoryDto) {
    const merchant = await this.getMerchantByUserId(userId);
    const category = await this.getCategoryWithOwnership(categoryId, merchant.id);

    const updated = await this.prisma.category.update({
      where: { id: category.id },
      data: dto,
    });

    return updated;
  }

  /**
   * Remove categoria
   */
  async deleteCategory(userId: string, categoryId: string) {
    const merchant = await this.getMerchantByUserId(userId);
    const category = await this.getCategoryWithOwnership(categoryId, merchant.id);

    await this.prisma.category.delete({
      where: { id: category.id },
    });

    return { deleted: true };
  }

  // =============================================
  // PRODUCTS
  // =============================================

  /**
   * Cria produto para o merchant
   */
  async createProduct(userId: string, dto: CreateProductDto) {
    const merchant = await this.getMerchantByUserId(userId);

    // Verificar se categoria pertence ao merchant
    if (dto.categoryId) {
      await this.getCategoryWithOwnership(dto.categoryId, merchant.id);
    }

    const product = await this.prisma.product.create({
      data: {
        merchantId: merchant.id,
        categoryId: dto.categoryId,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        imageUrl: dto.imageUrl,
        isAvailable: dto.isAvailable ?? true,
        sortOrder: dto.sortOrder ?? 0,
        hasStock: dto.hasStock ?? false,
        stockQty: dto.stockQty,
      },
    });

    this.logger.log(`Produto criado: ${product.id}`);

    return product;
  }

  /**
   * Lista produtos do merchant
   */
  async findProducts(userId: string, options: {
    categoryId?: string;
    isAvailable?: boolean;
  } = {}) {
    const merchant = await this.getMerchantByUserId(userId);
    const { categoryId, isAvailable } = options;

    return this.prisma.product.findMany({
      where: {
        merchantId: merchant.id,
        deletedAt: null,
        ...(categoryId && { categoryId }),
        ...(isAvailable !== undefined && { isAvailable }),
      },
      include: {
        category: { select: { id: true, name: true } },
      },
      orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
    });
  }

  /**
   * Busca produto por ID
   */
  async findProductById(userId: string, productId: string) {
    const merchant = await this.getMerchantByUserId(userId);
    return this.getProductWithOwnership(productId, merchant.id);
  }

  /**
   * Atualiza produto
   */
  async updateProduct(userId: string, productId: string, dto: UpdateProductDto) {
    const merchant = await this.getMerchantByUserId(userId);
    const product = await this.getProductWithOwnership(productId, merchant.id);

    // Verificar se nova categoria pertence ao merchant
    if (dto.categoryId) {
      await this.getCategoryWithOwnership(dto.categoryId, merchant.id);
    }

    const updated = await this.prisma.product.update({
      where: { id: product.id },
      data: dto,
    });

    return updated;
  }

  /**
   * Remove produto (soft delete)
   */
  async deleteProduct(userId: string, productId: string) {
    const merchant = await this.getMerchantByUserId(userId);
    const product = await this.getProductWithOwnership(productId, merchant.id);

    await this.prisma.product.update({
      where: { id: product.id },
      data: { deletedAt: new Date(), isAvailable: false },
    });

    return { deleted: true };
  }

  /**
   * Toggle disponibilidade do produto
   */
  async toggleAvailability(userId: string, productId: string) {
    const merchant = await this.getMerchantByUserId(userId);
    const product = await this.getProductWithOwnership(productId, merchant.id);

    const updated = await this.prisma.product.update({
      where: { id: product.id },
      data: { isAvailable: !product.isAvailable },
    });

    return { isAvailable: updated.isAvailable };
  }

  // =============================================
  // ROTAS PÚBLICAS (para customers)
  // =============================================

  /**
   * Lista produtos de um merchant (público)
   */
  async findProductsByMerchant(merchantId: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant || merchant.status !== 'ACTIVE') {
      throw new NotFoundException('Estabelecimento não encontrado');
    }

    return this.prisma.product.findMany({
      where: {
        merchantId,
        isAvailable: true,
        deletedAt: null,
      },
      include: {
        category: { select: { id: true, name: true } },
      },
      orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
    });
  }

  // =============================================
  // HELPERS
  // =============================================

  private async getMerchantByUserId(userId: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { userId },
    });

    if (!merchant) {
      throw new NotFoundException('Estabelecimento não encontrado');
    }

    return merchant;
  }

  private async getCategoryWithOwnership(categoryId: string, merchantId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    if (category.merchantId !== merchantId) {
      throw new ForbiddenException('Categoria não pertence ao seu estabelecimento');
    }

    return category;
  }

  private async getProductWithOwnership(productId: string, merchantId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { category: true },
    });

    if (!product || product.deletedAt) {
      throw new NotFoundException('Produto não encontrado');
    }

    if (product.merchantId !== merchantId) {
      throw new ForbiddenException('Produto não pertence ao seu estabelecimento');
    }

    return product;
  }
}
