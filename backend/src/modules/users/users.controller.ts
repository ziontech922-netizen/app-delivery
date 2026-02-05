import { Controller, Get, Param, Query, Patch, Body } from '@nestjs/common';
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
