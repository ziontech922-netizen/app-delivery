import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@shared/prisma';
import { Prisma } from '@prisma/client';
import { CreateListingDto, ListingCategory } from './dto/create-listing.dto';
import { UpdateListingDto, ListingStatus } from './dto/update-listing.dto';
import { ListingQueryDto, ListingSortBy } from './dto/listing-query.dto';

@Injectable()
export class ListingsService {
  private readonly logger = new Logger(ListingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // =============================================
  // CRUD OPERATIONS
  // =============================================

  async create(userId: string, dto: CreateListingDto) {
    this.logger.log(`Creating listing for user ${userId}: ${dto.title}`);

    // Se não informar localização, usar a padrão do usuário
    let locationData = {
      city: dto.city,
      state: dto.state,
      neighborhood: dto.neighborhood,
      latitude: dto.latitude,
      longitude: dto.longitude,
    };

    if (!dto.city && !dto.state) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { defaultCity: true, defaultState: true, defaultLatitude: true, defaultLongitude: true },
      });

      if (user) {
        locationData = {
          city: user.defaultCity || undefined,
          state: user.defaultState || undefined,
          neighborhood: dto.neighborhood,
          latitude: user.defaultLatitude ? Number(user.defaultLatitude) : undefined,
          longitude: user.defaultLongitude ? Number(user.defaultLongitude) : undefined,
        };
      }
    }

    const listing = await this.prisma.listing.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        price: dto.price,
        priceType: dto.priceType || 'FIXED',
        category: dto.category as any,
        subcategory: dto.subcategory,
        tags: dto.tags || [],
        images: dto.images || [],
        audioUrl: dto.audioUrl,
        city: locationData.city,
        state: locationData.state,
        neighborhood: locationData.neighborhood,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        aiGenerated: dto.aiGenerated || false,
        aiMetadata: dto.aiMetadata || undefined,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            userHandle: true,
            avatarUrl: true,
          },
        },
      },
    });

    this.logger.log(`Listing created with ID: ${listing.id}`);
    return listing;
  }

  async findAll(query: ListingQueryDto) {
    const {
      search,
      category,
      subcategory,
      status = ListingStatus.ACTIVE,
      city,
      state,
      minPrice,
      maxPrice,
      userId,
      featured,
      latitude,
      longitude,
      radiusKm = 50,
      sortBy = ListingSortBy.CREATED_AT,
      page = 1,
      limit = 20,
    } = query;

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: Prisma.ListingWhereInput = {
      deletedAt: null,
      status: status as any,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search.toLowerCase() } },
      ];
    }

    if (category) {
      where.category = category as any;
    }

    if (subcategory) {
      where.subcategory = subcategory;
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (state) {
      where.state = state;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    if (userId) {
      where.userId = userId;
    }

    if (featured) {
      where.isFeatured = true;
    }

    // Ordenação
    let orderBy: Prisma.ListingOrderByWithRelationInput = {};
    switch (sortBy) {
      case ListingSortBy.PRICE_ASC:
        orderBy = { price: 'asc' };
        break;
      case ListingSortBy.PRICE_DESC:
        orderBy = { price: 'desc' };
        break;
      case ListingSortBy.VIEW_COUNT:
        orderBy = { viewCount: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              userHandle: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: { favorites: true },
          },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      data: listings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, incrementView = false) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            userHandle: true,
            avatarUrl: true,
            phone: true,
            createdAt: true,
          },
        },
        _count: {
          select: { favorites: true },
        },
      },
    });

    if (!listing || listing.deletedAt) {
      throw new NotFoundException('Anúncio não encontrado');
    }

    // Incrementar visualizações
    if (incrementView) {
      await this.prisma.listing.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });
    }

    return listing;
  }

  async findByUserHandle(userHandle: string, page = 1, limit = 20) {
    const user = await this.prisma.user.findUnique({
      where: { userHandle },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return this.findAll({ userId: user.id, page, limit });
  }

  async update(id: string, userId: string, dto: UpdateListingDto) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!listing) {
      throw new NotFoundException('Anúncio não encontrado');
    }

    if (listing.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para editar este anúncio');
    }

    return this.prisma.listing.update({
      where: { id },
      data: {
        ...dto,
        category: dto.category as any,
        status: dto.status as any,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            userHandle: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!listing) {
      throw new NotFoundException('Anúncio não encontrado');
    }

    if (listing.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para remover este anúncio');
    }

    // Soft delete
    await this.prisma.listing.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'REMOVED' },
    });

    return { success: true };
  }

  // =============================================
  // FAVORITES
  // =============================================

  async addFavorite(listingId: string, userId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Anúncio não encontrado');
    }

    await this.prisma.listingFavorite.upsert({
      where: {
        userId_listingId: { userId, listingId },
      },
      create: { userId, listingId },
      update: {},
    });

    // Atualizar contagem
    await this.prisma.listing.update({
      where: { id: listingId },
      data: { favoriteCount: { increment: 1 } },
    });

    return { success: true };
  }

  async removeFavorite(listingId: string, userId: string) {
    const favorite = await this.prisma.listingFavorite.findUnique({
      where: {
        userId_listingId: { userId, listingId },
      },
    });

    if (!favorite) {
      return { success: true };
    }

    await this.prisma.listingFavorite.delete({
      where: {
        userId_listingId: { userId, listingId },
      },
    });

    // Atualizar contagem
    await this.prisma.listing.update({
      where: { id: listingId },
      data: { favoriteCount: { decrement: 1 } },
    });

    return { success: true };
  }

  async getUserFavorites(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      this.prisma.listingFavorite.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          listing: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  userHandle: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.listingFavorite.count({ where: { userId } }),
    ]);

    return {
      data: favorites.map((f) => f.listing),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // =============================================
  // CATEGORIES & STATS
  // =============================================

  async getCategories() {
    const categories = await this.prisma.listing.groupBy({
      by: ['category'],
      where: { status: 'ACTIVE', deletedAt: null },
      _count: { id: true },
    });

    return categories.map((c) => ({
      name: c.category,
      count: c._count.id,
    }));
  }

  async getStats(city?: string) {
    const where: Prisma.ListingWhereInput = {
      status: 'ACTIVE',
      deletedAt: null,
    };

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    const [total, byCategory] = await Promise.all([
      this.prisma.listing.count({ where }),
      this.prisma.listing.groupBy({
        by: ['category'],
        where,
        _count: { id: true },
      }),
    ]);

    return {
      total,
      byCategory: byCategory.map((c) => ({
        category: c.category,
        count: c._count.id,
      })),
    };
  }
}
