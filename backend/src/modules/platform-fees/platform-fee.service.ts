import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@shared/prisma/prisma.service';
import {
  CreatePlatformFeeDto,
  UpdatePlatformFeeDto,
  PlatformFeeResponse,
  FeeCalculationResult,
  FeePreviewResult,
} from './dto/platform-fee.dto';

@Injectable()
export class PlatformFeeService {
  private readonly logger = new Logger(PlatformFeeService.name);

  constructor(private readonly prisma: PrismaService) {}

  // =============================================
  // CRUD OPERATIONS
  // =============================================

  /**
   * Cria nova taxa da plataforma
   */
  async create(dto: CreatePlatformFeeDto): Promise<PlatformFeeResponse> {
    // Validar que pelo menos uma taxa foi informada
    if (!dto.percentage && !dto.fixedFee && !dto.deliveryFee) {
      throw new BadRequestException(
        'Pelo menos uma taxa deve ser informada (percentage, fixedFee ou deliveryFee)',
      );
    }

    // Se for taxa global, verificar se já existe uma ativa
    if (!dto.merchantId && dto.isActive !== false) {
      const existingGlobal = await this.prisma.platformFee.findFirst({
        where: {
          merchantId: null,
          isActive: true,
        },
      });

      if (existingGlobal) {
        throw new BadRequestException(
          'Já existe uma taxa global ativa. Desative-a primeiro ou crie uma taxa específica para merchant.',
        );
      }
    }

    // Se merchantId fornecido, validar que existe
    if (dto.merchantId) {
      const merchant = await this.prisma.merchant.findUnique({
        where: { id: dto.merchantId },
      });

      if (!merchant) {
        throw new NotFoundException('Merchant não encontrado');
      }
    }

    const fee = await this.prisma.platformFee.create({
      data: {
        name: dto.name,
        description: dto.description,
        percentage: dto.percentage,
        fixedFee: dto.fixedFee,
        deliveryFee: dto.deliveryFee,
        merchantId: dto.merchantId,
        minOrderValue: dto.minOrderValue,
        maxFee: dto.maxFee,
        isActive: dto.isActive ?? true,
        priority: dto.priority ?? 0,
      },
      include: {
        merchant: {
          select: { businessName: true },
        },
      },
    });

    this.logger.log(`Taxa criada: ${fee.name} (${fee.id})`);

    return this.mapToResponse(fee);
  }

  /**
   * Lista todas as taxas
   */
  async findAll(options: {
    isActive?: boolean;
    merchantId?: string;
  } = {}): Promise<PlatformFeeResponse[]> {
    const { isActive, merchantId } = options;

    const fees = await this.prisma.platformFee.findMany({
      where: {
        ...(isActive !== undefined && { isActive }),
        ...(merchantId !== undefined && { merchantId }),
      },
      include: {
        merchant: {
          select: { businessName: true },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return fees.map((f: any) => this.mapToResponse(f));
  }

  /**
   * Busca taxa por ID
   */
  async findById(id: string): Promise<PlatformFeeResponse> {
    const fee = await this.prisma.platformFee.findUnique({
      where: { id },
      include: {
        merchant: {
          select: { businessName: true },
        },
      },
    });

    if (!fee) {
      throw new NotFoundException('Taxa não encontrada');
    }

    return this.mapToResponse(fee);
  }

  /**
   * Atualiza taxa
   */
  async update(id: string, dto: UpdatePlatformFeeDto): Promise<PlatformFeeResponse> {
    const existing = await this.prisma.platformFee.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Taxa não encontrada');
    }

    // Se ativando taxa global, verificar conflitos
    if (dto.isActive === true && !existing.merchantId && !dto.merchantId) {
      const existingGlobal = await this.prisma.platformFee.findFirst({
        where: {
          merchantId: null,
          isActive: true,
          id: { not: id },
        },
      });

      if (existingGlobal) {
        throw new BadRequestException(
          'Já existe uma taxa global ativa. Desative-a primeiro.',
        );
      }
    }

    const fee = await this.prisma.platformFee.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.percentage !== undefined && { percentage: dto.percentage }),
        ...(dto.fixedFee !== undefined && { fixedFee: dto.fixedFee }),
        ...(dto.deliveryFee !== undefined && { deliveryFee: dto.deliveryFee }),
        ...(dto.merchantId !== undefined && { merchantId: dto.merchantId }),
        ...(dto.minOrderValue !== undefined && { minOrderValue: dto.minOrderValue }),
        ...(dto.maxFee !== undefined && { maxFee: dto.maxFee }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
      },
      include: {
        merchant: {
          select: { businessName: true },
        },
      },
    });

    this.logger.log(`Taxa atualizada: ${fee.name} (${fee.id})`);

    return this.mapToResponse(fee);
  }

  /**
   * Remove taxa (soft delete - desativa)
   */
  async delete(id: string): Promise<void> {
    const existing = await this.prisma.platformFee.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Taxa não encontrada');
    }

    await this.prisma.platformFee.update({
      where: { id },
      data: { isActive: false },
    });

    this.logger.log(`Taxa desativada: ${existing.name} (${id})`);
  }

  /**
   * Remove taxa permanentemente
   */
  async hardDelete(id: string): Promise<void> {
    const existing = await this.prisma.platformFee.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Taxa não encontrada');
    }

    await this.prisma.platformFee.delete({
      where: { id },
    });

    this.logger.log(`Taxa removida permanentemente: ${existing.name} (${id})`);
  }

  // =============================================
  // FEE CALCULATION
  // =============================================

  /**
   * Busca a taxa aplicável para um merchant
   * Prioridade: taxa específica do merchant > taxa global
   */
  async getApplicableFee(merchantId: string): Promise<PlatformFeeResponse | null> {
    // Primeiro, buscar taxa específica do merchant
    const merchantFee = await this.prisma.platformFee.findFirst({
      where: {
        merchantId,
        isActive: true,
      },
      include: {
        merchant: {
          select: { businessName: true },
        },
      },
      orderBy: { priority: 'desc' },
    });

    if (merchantFee) {
      return this.mapToResponse(merchantFee);
    }

    // Se não encontrar, buscar taxa global
    const globalFee = await this.prisma.platformFee.findFirst({
      where: {
        merchantId: null,
        isActive: true,
      },
      orderBy: { priority: 'desc' },
    });

    if (globalFee) {
      return this.mapToResponse(globalFee);
    }

    return null;
  }

  /**
   * Calcula as taxas para um pedido
   * 
   * Estrutura de taxas:
   * - percentageFee: Comissão percentual (deduzida do merchant)
   * - fixedFee: Taxa de serviço fixa (cobrada do cliente)
   * - deliveryFee: Taxa adicional de delivery da plataforma (cobrada do cliente)
   * 
   * O cliente paga: subtotal + merchantDelivery + fixedFee + platformDeliveryFee - desconto
   * O merchant recebe: subtotal - percentageFee
   */
  async calculateFees(
    merchantId: string,
    subtotal: number,
  ): Promise<FeeCalculationResult> {
    const applicableFee = await this.getApplicableFee(merchantId);

    if (!applicableFee) {
      return {
        platformFee: 0,
        serviceFee: 0,
        merchantNet: subtotal,
        breakdown: {
          percentageFee: 0,
          fixedFee: 0,
          deliveryFee: 0,
        },
        appliedFee: null,
      };
    }

    // Verificar valor mínimo do pedido
    if (applicableFee.minOrderValue && subtotal < applicableFee.minOrderValue) {
      return {
        platformFee: 0,
        serviceFee: 0,
        merchantNet: subtotal,
        breakdown: {
          percentageFee: 0,
          fixedFee: 0,
          deliveryFee: 0,
        },
        appliedFee: null,
      };
    }

    // Calcular cada componente
    let percentageFee = 0;
    if (applicableFee.percentage) {
      percentageFee = subtotal * (applicableFee.percentage / 100);
    }

    const fixedFee = applicableFee.fixedFee || 0;
    const deliveryFeeAddition = applicableFee.deliveryFee || 0;

    // Taxa de serviço cobrada do cliente (fixa + delivery adicional)
    const serviceFee = fixedFee + deliveryFeeAddition;

    // Comissão da plataforma (percentual) - deduzida do merchant
    let platformFee = percentageFee;

    // Aplicar teto máximo se definido
    if (applicableFee.maxFee && platformFee > applicableFee.maxFee) {
      platformFee = applicableFee.maxFee;
    }

    // Valor líquido do merchant = subtotal - comissão percentual
    const merchantNet = subtotal - platformFee;

    return {
      platformFee: Math.round(platformFee * 100) / 100,
      serviceFee: Math.round(serviceFee * 100) / 100,
      merchantNet: Math.round(merchantNet * 100) / 100,
      breakdown: {
        percentageFee: Math.round(percentageFee * 100) / 100,
        fixedFee,
        deliveryFee: deliveryFeeAddition,
      },
      appliedFee: {
        id: applicableFee.id,
        name: applicableFee.name,
      },
    };
  }

  /**
   * Preview completo do pedido com taxas
   */
  async previewOrderFees(params: {
    merchantId: string;
    subtotal: number;
    merchantDeliveryFee: number;
    discount?: number;
  }): Promise<FeePreviewResult> {
    const { merchantId, subtotal, merchantDeliveryFee, discount = 0 } = params;

    const feeResult = await this.calculateFees(merchantId, subtotal);

    // Taxa adicional de delivery da plataforma
    const platformDeliveryFee = feeResult.breakdown.deliveryFee;

    // Total de delivery = merchant + plataforma
    const totalDeliveryFee = merchantDeliveryFee + platformDeliveryFee;

    // Taxa de serviço cobrada do cliente (fixedFee + platformDeliveryFee)
    const serviceFee = feeResult.serviceFee;

    // Total = subtotal + delivery total + taxa de serviço - desconto
    const total = subtotal + totalDeliveryFee + feeResult.breakdown.fixedFee - discount;

    return {
      subtotal,
      deliveryFee: totalDeliveryFee,
      serviceFee,
      platformFee: feeResult.platformFee,
      discount,
      total: Math.round(total * 100) / 100,
      merchantNet: feeResult.merchantNet,
      breakdown: {
        percentageFee: feeResult.breakdown.percentageFee,
        fixedFee: feeResult.breakdown.fixedFee,
        platformDeliveryFee,
      },
    };
  }

  // =============================================
  // HELPERS
  // =============================================

  private mapToResponse(fee: any): PlatformFeeResponse {
    return {
      id: fee.id,
      name: fee.name,
      description: fee.description,
      percentage: fee.percentage ? Number(fee.percentage) : null,
      fixedFee: fee.fixedFee ? Number(fee.fixedFee) : null,
      deliveryFee: fee.deliveryFee ? Number(fee.deliveryFee) : null,
      merchantId: fee.merchantId,
      merchantName: fee.merchant?.businessName,
      minOrderValue: fee.minOrderValue ? Number(fee.minOrderValue) : null,
      maxFee: fee.maxFee ? Number(fee.maxFee) : null,
      isActive: fee.isActive,
      priority: fee.priority,
      createdAt: fee.createdAt,
      updatedAt: fee.updatedAt,
    };
  }
}
