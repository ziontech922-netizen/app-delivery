import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard que permite acesso anônimo, mas ainda tenta autenticar o usuário se um token for fornecido.
 * Útil para endpoints que funcionam tanto para usuários autenticados quanto anônimos.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Chamar o método pai para tentar autenticar
    return super.canActivate(context);
  }

  handleRequest<TUser = any>(err: any, user: TUser, info: any): TUser | null {
    // Se houver erro ou não houver usuário, retornar null em vez de lançar exceção
    if (err || !user) {
      return null as any;
    }
    return user;
  }
}
