import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@shared/prisma';
import { UserRole, UserStatus } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Busca usuário por ID
   */
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        emailVerifiedAt: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  /**
   * Busca usuário por email
   */
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });
  }

  /**
   * Lista usuários com paginação (admin)
   */
  async findAll(options: { page?: number; limit?: number; role?: UserRole; status?: UserStatus }) {
    const { page = 1, limit = 20, role, status } = options;
    const skip = (page - 1) * limit;

    const where = {
      ...(role && { role }),
      ...(status && { status }),
      deletedAt: null,
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Atualiza perfil do usuário autenticado
   */
  async updateProfile(id: string, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    bio?: string;
    avatarUrl?: string;
    defaultCity?: string;
    defaultState?: string;
  }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        bio: true,
        avatarUrl: true,
        profilePicture: true,
        role: true,
        status: true,
        defaultCity: true,
        defaultState: true,
        createdAt: true,
      },
    });
  }

  /**
   * Busca endereços do usuário
   */
  async getAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Cria endereço para o usuário
   */
  async createAddress(userId: string, data: {
    label?: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    latitude?: number;
    longitude?: number;
    isDefault?: boolean;
  }) {
    if (data.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.prisma.address.create({
      data: { ...data, userId },
    });
  }

  /**
   * Atualiza endereço do usuário
   */
  async updateAddress(userId: string, addressId: string, data: {
    label?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    latitude?: number;
    longitude?: number;
    isDefault?: boolean;
  }) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!address) throw new NotFoundException('Endereço não encontrado');

    if (data.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.prisma.address.update({
      where: { id: addressId },
      data,
    });
  }

  /**
   * Remove endereço do usuário
   */
  async deleteAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!address) throw new NotFoundException('Endereço não encontrado');

    await this.prisma.address.delete({ where: { id: addressId } });
    return { success: true };
  }

  /**
   * Busca avaliações feitas pelo usuário
   */
  async getReviews(userId: string) {
    return this.prisma.review.findMany({
      where: { customerId: userId },
      include: {
        merchant: { select: { businessName: true, tradeName: true, logoUrl: true } },
        order: { select: { id: true, orderNumber: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Atualiza status do usuário (admin)
   */
  async updateStatus(id: string, status: UserStatus) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return this.prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        email: true,
        status: true,
      },
    });
  }

  /**
   * Atualiza role do usuário (admin)
   */
  async updateRole(id: string, role: UserRole) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });
  }
}
