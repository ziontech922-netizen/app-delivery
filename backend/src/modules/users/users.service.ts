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
