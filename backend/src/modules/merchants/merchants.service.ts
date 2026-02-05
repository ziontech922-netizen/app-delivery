import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { MerchantStatus, UserRole } from '@prisma/client';
import { PrismaService } from '@shared/prisma';
import { CreateMerchantDto, UpdateMerchantDto } from './dto';

@Injectable()
export class MerchantsService {
  private readonly logger = new Logger(MerchantsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um novo merchant para o usuário autenticado
   */
  async create(userId: string, dto: CreateMerchantDto) {
    // Verificar se usuário já tem merchant
    const existingMerchant = await this.prisma.merchant.findUnique({
      where: { userId },
    });

    if (existingMerchant) {
      throw new ConflictException('Usuário já possui um estabelecimento cadastrado');
    }

    // Verificar se CNPJ já existe
    const existingDocument = await this.prisma.merchant.findUnique({
      where: { document: dto.document },
    });

    if (existingDocument) {
      throw new ConflictException('CNPJ já cadastrado');
    }

    // Criar merchant e atualizar role do usuário
    const [merchant] = await this.prisma.$transaction([
      this.prisma.merchant.create({
        data: {
          userId,
          businessName: dto.businessName,
          tradeName: dto.tradeName,
          document: dto.document,
          description: dto.description,
          street: dto.street,
          number: dto.number,
          complement: dto.complement,
          neighborhood: dto.neighborhood,
          city: dto.city,
          state: dto.state.toUpperCase(),
          zipCode: dto.zipCode,
          latitude: dto.latitude,
          longitude: dto.longitude,
          minimumOrder: dto.minimumOrder ?? 0,
          deliveryFee: dto.deliveryFee ?? 0,
          estimatedTime: dto.estimatedTime ?? 30,
          status: MerchantStatus.PENDING_APPROVAL,
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { role: UserRole.MERCHANT },
      }),
    ]);

    this.logger.log(`Merchant criado: ${merchant.id} por usuário ${userId}`);

    return this.sanitizeMerchant(merchant);
  }

  /**
   * Busca merchant do usuário autenticado
   */
  async findMyMerchant(userId: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { userId },
      include: {
        categories: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { products: true, orders: true },
        },
      },
    });

    if (!merchant) {
      throw new NotFoundException('Estabelecimento não encontrado');
    }

    return this.sanitizeMerchant(merchant);
  }

  /**
   * Atualiza merchant do usuário autenticado
   */
  async update(userId: string, dto: UpdateMerchantDto) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { userId },
    });

    if (!merchant) {
      throw new NotFoundException('Estabelecimento não encontrado');
    }

    const updated = await this.prisma.merchant.update({
      where: { id: merchant.id },
      data: {
        ...dto,
        state: dto.state?.toUpperCase(),
      },
    });

    this.logger.log(`Merchant atualizado: ${merchant.id}`);

    return this.sanitizeMerchant(updated);
  }

  /**
   * Alterna status aberto/fechado do merchant
   */
  async toggleOpen(userId: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { userId },
    });

    if (!merchant) {
      throw new NotFoundException('Estabelecimento não encontrado');
    }

    if (merchant.status !== MerchantStatus.ACTIVE) {
      throw new ForbiddenException('Estabelecimento não está ativo');
    }

    const updated = await this.prisma.merchant.update({
      where: { id: merchant.id },
      data: { isOpen: !merchant.isOpen },
    });

    return { isOpen: updated.isOpen };
  }

  /**
   * Lista merchants ativos (para customers)
   */
  async findAllActive(options: {
    page?: number;
    limit?: number;
    city?: string;
    search?: string;
  }) {
    const { page = 1, limit = 20, city, search } = options;
    const skip = (page - 1) * limit;

    const where = {
      status: MerchantStatus.ACTIVE,
      deletedAt: null,
      ...(city && { city: { contains: city, mode: 'insensitive' as const } }),
      ...(search && {
        OR: [
          { businessName: { contains: search, mode: 'insensitive' as const } },
          { tradeName: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [merchants, total] = await Promise.all([
      this.prisma.merchant.findMany({
        where,
        select: {
          id: true,
          businessName: true,
          tradeName: true,
          description: true,
          logoUrl: true,
          bannerUrl: true,
          city: true,
          state: true,
          isOpen: true,
          minimumOrder: true,
          deliveryFee: true,
          estimatedTime: true,
          _count: {
            select: { products: true },
          },
        },
        skip,
        take: limit,
        orderBy: [{ isOpen: 'desc' }, { businessName: 'asc' }],
      }),
      this.prisma.merchant.count({ where }),
    ]);

    return {
      data: merchants,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Busca merchant por ID (público)
   */
  async findById(id: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id },
      include: {
        categories: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            products: {
              where: { isAvailable: true, deletedAt: null },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!merchant || merchant.status !== MerchantStatus.ACTIVE) {
      throw new NotFoundException('Estabelecimento não encontrado');
    }

    return this.sanitizeMerchant(merchant);
  }

  /**
   * Aprova merchant (admin)
   */
  async approve(id: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id },
    });

    if (!merchant) {
      throw new NotFoundException('Estabelecimento não encontrado');
    }

    const updated = await this.prisma.merchant.update({
      where: { id },
      data: { status: MerchantStatus.ACTIVE },
    });

    this.logger.log(`Merchant aprovado: ${id}`);

    return this.sanitizeMerchant(updated);
  }

  /**
   * Lista todos os merchants (admin)
   */
  async findAll(options: {
    page?: number;
    limit?: number;
    status?: MerchantStatus;
  }) {
    const { page = 1, limit = 20, status } = options;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(status && { status }),
    };

    const [merchants, total] = await Promise.all([
      this.prisma.merchant.findMany({
        where,
        include: {
          user: {
            select: { email: true, firstName: true, lastName: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.merchant.count({ where }),
    ]);

    return {
      data: merchants.map((m) => this.sanitizeMerchant(m)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Remove dados sensíveis do merchant
   */
  private sanitizeMerchant(merchant: any) {
    const { userId, ...rest } = merchant;
    return rest;
  }
}
