import { applyDecorators, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from './roles.decorator';

/**
 * Decorator combinado para proteger rotas com autenticação e roles
 * @example @Auth(UserRole.ADMIN) - Apenas admins
 * @example @Auth(UserRole.MERCHANT, UserRole.ADMIN) - Merchants ou admins
 * @example @Auth() - Qualquer usuário autenticado
 */
export const Auth = (...roles: UserRole[]) => {
  if (roles.length === 0) {
    return applyDecorators(UseGuards(JwtAuthGuard));
  }
  return applyDecorators(UseGuards(JwtAuthGuard, RolesGuard), Roles(...roles));
};
