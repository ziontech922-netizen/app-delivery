import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@shared/prisma';
import { Prisma } from '@prisma/client';
import { CreateSponsorDto, UpdateSponsorDto, SponsorPlacement } from './dto/create-sponsor.dto';
import { SponsorQueryDto } from './dto/sponsor-query.dto';

@Injectable()
export class SponsorsService {
  private readonly logger = new Logger(SponsorsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // =============================================
  // CRUD OPERATIONS
  // =============================================

  async create(dto: CreateSponsorDto) {
    const sponsor = await this.prisma.sponsor.create({
      data: {
        name: dto.name,
        description: dto.description,
        logoUrl: dto.logoUrl,
        bannerUrl: dto.bannerUrl,
        websiteUrl: dto.websiteUrl,
        placements: dto.placements as any[],
        priority: dto.priority || 0,
        targetCities: dto.targetCities || [],
        targetCategories: dto.targetCategories as any[] || [],
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        isActive: dto.isActive ?? true,
      },
    });

    this.logger.log(`Sponsor created: ${sponsor.id}`);
    return sponsor;
  }

  async findAll(query: SponsorQueryDto) {
    const {
      placement,
      city,
      category,
      activeOnly = true,
      page = 1,
      limit = 10,
    } = query;

    const skip = (page - 1) * limit;
    const now = new Date();

    const where: Prisma.SponsorWhereInput = {};

    if (activeOnly) {
      where.isActive = true;
      where.startDate = { lte: now };
      where.endDate = { gte: now };
    }

    if (placement) {
      where.placements = { has: placement as any };
    }

    if (city) {
      where.OR = [
        { targetCities: { isEmpty: true } },
        { targetCities: { has: city } },
      ];
    }

    if (category) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        {
          OR: [
            { targetCategories: { isEmpty: true } },
            { targetCategories: { has: category as any } },
          ],
        },
      ];
    }

    const [sponsors, total] = await Promise.all([
      this.prisma.sponsor.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      this.prisma.sponsor.count({ where }),
    ]);

    return {
      data: sponsors,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const sponsor = await this.prisma.sponsor.findUnique({
      where: { id },
    });

    if (!sponsor) {
      throw new NotFoundException('Patrocinador não encontrado');
    }

    return sponsor;
  }

  async update(id: string, dto: UpdateSponsorDto) {
    const sponsor = await this.prisma.sponsor.findUnique({
      where: { id },
    });

    if (!sponsor) {
      throw new NotFoundException('Patrocinador não encontrado');
    }

    return this.prisma.sponsor.update({
      where: { id },
      data: {
        ...dto,
        placements: dto.placements as any[],
        targetCategories: dto.targetCategories as any[],
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async remove(id: string) {
    const sponsor = await this.prisma.sponsor.findUnique({
      where: { id },
    });

    if (!sponsor) {
      throw new NotFoundException('Patrocinador não encontrado');
    }

    await this.prisma.sponsor.delete({
      where: { id },
    });

    return { success: true };
  }

  // =============================================
  // PUBLIC ENDPOINTS
  // =============================================

  async getForPlacement(placement: SponsorPlacement, city?: string, category?: string) {
    const now = new Date();

    const where: Prisma.SponsorWhereInput = {
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
      placements: { has: placement as any },
    };

    // Filtro por cidade
    if (city) {
      where.OR = [
        { targetCities: { isEmpty: true } },
        { targetCities: { has: city } },
      ];
    }

    // Filtro por categoria
    if (category) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        {
          OR: [
            { targetCategories: { isEmpty: true } },
            { targetCategories: { has: category as any } },
          ],
        },
      ];
    }

    const sponsors = await this.prisma.sponsor.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
      ],
      take: 5, // Limitar quantidade
    });

    return sponsors;
  }

  // =============================================
  // METRICS
  // =============================================

  async recordImpression(id: string) {
    await this.prisma.sponsor.update({
      where: { id },
      data: { impressions: { increment: 1 } },
    });
  }

  async recordClick(id: string) {
    await this.prisma.sponsor.update({
      where: { id },
      data: { clicks: { increment: 1 } },
    });

    return { success: true };
  }

  async getMetrics(id: string) {
    const sponsor = await this.prisma.sponsor.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        impressions: true,
        clicks: true,
        startDate: true,
        endDate: true,
      },
    });

    if (!sponsor) {
      throw new NotFoundException('Patrocinador não encontrado');
    }

    const ctr = sponsor.impressions > 0
      ? (sponsor.clicks / sponsor.impressions * 100).toFixed(2)
      : '0.00';

    return {
      ...sponsor,
      ctr: `${ctr}%`,
    };
  }
}
