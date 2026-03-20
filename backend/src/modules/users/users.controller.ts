import { Controller, Get, Post, Param, Query, Patch, Delete, Body } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import { UsersService } from './users.service';
import { Auth, CurrentUser } from '../auth/decorators';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /api/v1/users/me
   * Retorna dados do usuário logado
   */
  @Get('me')
  @Auth()
  async getMe(@CurrentUser() user: JwtPayload) {
    return this.usersService.findById(user.sub);
  }

  /**
   * PATCH /api/v1/users/me
   * Atualiza perfil do usuário logado
   */
  @Patch('me')
  @Auth()
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      bio?: string;
      avatarUrl?: string;
      defaultCity?: string;
      defaultState?: string;
    },
  ) {
    return this.usersService.updateProfile(user.sub, data);
  }

  /**
   * GET /api/v1/users/me/addresses
   */
  @Get('me/addresses')
  @Auth()
  async getAddresses(@CurrentUser() user: JwtPayload) {
    return this.usersService.getAddresses(user.sub);
  }

  /**
   * POST /api/v1/users/me/addresses
   */
  @Post('me/addresses')
  @Auth()
  async createAddress(
    @CurrentUser() user: JwtPayload,
    @Body() data: {
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
    },
  ) {
    return this.usersService.createAddress(user.sub, data);
  }

  /**
   * PATCH /api/v1/users/me/addresses/:id
   */
  @Patch('me/addresses/:id')
  @Auth()
  async updateAddress(
    @CurrentUser() user: JwtPayload,
    @Param('id') addressId: string,
    @Body() data: {
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
    },
  ) {
    return this.usersService.updateAddress(user.sub, addressId, data);
  }

  /**
   * DELETE /api/v1/users/me/addresses/:id
   */
  @Delete('me/addresses/:id')
  @Auth()
  async deleteAddress(
    @CurrentUser() user: JwtPayload,
    @Param('id') addressId: string,
  ) {
    return this.usersService.deleteAddress(user.sub, addressId);
  }

  /**
   * GET /api/v1/users/me/reviews
   */
  @Get('me/reviews')
  @Auth()
  async getReviews(@CurrentUser() user: JwtPayload) {
    return this.usersService.getReviews(user.sub);
  }

  /**
   * GET /api/v1/users
   * Lista usuários (admin only)
   */
  @Get()
  @Auth(UserRole.ADMIN)
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('role') role?: UserRole,
    @Query('status') status?: UserStatus,
  ) {
    return this.usersService.findAll({ page, limit, role, status });
  }

  /**
   * GET /api/v1/users/:id/public
   * Retorna perfil público do usuário (sem autenticação)
   */
  @Get(':id/public')
  async getPublicProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }

  /**
   * GET /api/v1/users/:id
   * Busca usuário por ID (admin only)
   */
  @Get(':id')
  @Auth(UserRole.ADMIN)
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  /**
   * PATCH /api/v1/users/:id/status
   * Atualiza status do usuário (admin only)
   */
  @Patch(':id/status')
  @Auth(UserRole.ADMIN)
  async updateStatus(@Param('id') id: string, @Body('status') status: UserStatus) {
    return this.usersService.updateStatus(id, status);
  }

  /**
   * PATCH /api/v1/users/:id/role
   * Atualiza role do usuário (admin only)
   */
  @Patch(':id/role')
  @Auth(UserRole.ADMIN)
  async updateRole(@Param('id') id: string, @Body('role') role: UserRole) {
    return this.usersService.updateRole(id, role);
  }
}
