import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Decorator para definir roles permitidas em uma rota
 * @example @Roles(UserRole.ADMIN, UserRole.MERCHANT)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
