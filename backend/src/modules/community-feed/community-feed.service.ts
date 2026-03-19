import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@shared/prisma';
import { Prisma } from '@prisma/client';
import { FeedQueryDto, FeedItemType } from './dto/feed-query.dto';
import { CreateFeedItemDto } from './dto/create-feed-item.dto';

@Injectable()
export class CommunityFeedService {
  private readonly logger = new Logger(CommunityFeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  // =============================================
  // FEED RETRIEVAL
  // =============================================

  async getFeed(query: FeedQueryDto, userId?: string) {
    const { city, state, type, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const now = new Date();

    // Construir filtros
    const where: Prisma.CommunityFeedItemWhereInput = {
      isActive: true,
      OR: [
        { startDate: null },
        { startDate: { lte: now } },
      ],
      AND: [
        {
          OR: [
            { endDate: null },
            { endDate: { gte: now } },
          ],
        },
      ],
    };

    // Filtro por localização
    if (city || state) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        {
          OR: [
            { city: null, state: null }, // Itens globais
            { city: city || undefined, state: state || undefined },
          ],
        },
      ];
    }

    if (type) {
      where.type = type as any;
    }

    const [items, total] = await Promise.all([
      this.prisma.communityFeedItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      this.prisma.communityFeedItem.count({ where }),
    ]);

    // Enriquecer com dados relacionados
    const enrichedItems = await this.enrichFeedItems(items);

    return {
      data: enrichedItems,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPersonalizedFeed(userId: string, query: FeedQueryDto) {
    // Obter preferências do usuário
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { defaultCity: true, defaultState: true },
    });

    // Usar localização do usuário se não especificada
    const feedQuery: FeedQueryDto = {
      ...query,
      city: query.city || user?.defaultCity || undefined,
      state: query.state || user?.defaultState || undefined,
    };

    return this.getFeed(feedQuery, userId);
  }

  // =============================================
  // FEED ITEM MANAGEMENT (Admin)
  // =============================================

  async create(dto: CreateFeedItemDto) {
    const item = await this.prisma.communityFeedItem.create({
      data: {
        type: dto.type as any,
        title: dto.title,
        description: dto.description,
        imageUrl: dto.imageUrl,
        linkUrl: dto.linkUrl,
        listingId: dto.listingId,
        merchantId: dto.merchantId,
        sponsorId: dto.sponsorId,
        city: dto.city,
        state: dto.state,
        priority: dto.priority || 0,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        isActive: dto.isActive ?? true,
      },
    });

    this.logger.log(`Feed item created: ${item.id}`);
    return item;
  }

  async update(id: string, dto: Partial<CreateFeedItemDto>) {
    const item = await this.prisma.communityFeedItem.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Item do feed não encontrado');
    }

    return this.prisma.communityFeedItem.update({
      where: { id },
      data: {
        ...dto,
        type: dto.type as any,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async remove(id: string) {
    const item = await this.prisma.communityFeedItem.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Item do feed não encontrado');
    }

    await this.prisma.communityFeedItem.delete({
      where: { id },
    });

    return { success: true };
  }

  // =============================================
  // AUTO-GENERATION
  // =============================================

  async createFromListing(listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!listing) return null;

    return this.create({
      type: FeedItemType.NEW_LISTING,
      title: listing.title,
      description: listing.description?.substring(0, 200) || undefined,
      imageUrl: listing.images[0] || undefined,
      linkUrl: `/listings/${listing.id}`,
      listingId: listing.id,
      city: listing.city || undefined,
      state: listing.state || undefined,
      priority: listing.isFeatured ? 10 : 0,
    });
  }

  async createFromMerchant(merchantId: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) return null;

    return this.create({
      type: FeedItemType.NEW_MERCHANT,
      title: `Novo: ${merchant.tradeName || merchant.businessName}`,
      description: merchant.description?.substring(0, 200) || undefined,
      imageUrl: merchant.logoUrl || undefined,
      linkUrl: `/merchants/${merchant.id}`,
      merchantId: merchant.id,
      city: merchant.city,
      state: merchant.state,
      priority: 5,
    });
  }

  // =============================================
  // HELPERS
  // =============================================

  private async enrichFeedItems(items: any[]) {
    return Promise.all(
      items.map(async (item) => {
        const enriched: any = { ...item };

        // Carregar dados do listing se existir
        if (item.listingId) {
          const listing = await this.prisma.listing.findUnique({
            where: { id: item.listingId },
            select: {
              id: true,
              title: true,
              price: true,
              images: true,
              category: true,
            },
          });
          enriched.listing = listing;
        }

        // Carregar dados do merchant se existir
        if (item.merchantId) {
          const merchant = await this.prisma.merchant.findUnique({
            where: { id: item.merchantId },
            select: {
              id: true,
              tradeName: true,
              businessName: true,
              logoUrl: true,
              averageRating: true,
            },
          });
          enriched.merchant = merchant;
        }

        // Carregar dados do sponsor se existir
        if (item.sponsorId) {
          const sponsor = await this.prisma.sponsor.findUnique({
            where: { id: item.sponsorId },
            select: {
              id: true,
              name: true,
              logoUrl: true,
              websiteUrl: true,
            },
          });
          enriched.sponsor = sponsor;
        }

        return enriched;
      }),
    );
  }
}
