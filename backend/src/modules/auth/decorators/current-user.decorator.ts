import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator para extrair o usuário atual da requisição
 * @example @CurrentUser() user: JwtPayload
 * @example @CurrentUser('id') userId: string
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
