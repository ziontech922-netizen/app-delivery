import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '@shared/prisma';

export interface JwtPayload {
  sub: string; // userId
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload & { id: string }> {
    // Verificar se o usuário ainda existe e está ativo
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, status: true, role: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    if (user.status !== 'ACTIVE' && user.status !== 'PENDING_VERIFICATION') {
      throw new UnauthorizedException('Usuário inativo ou suspenso');
    }

    // Retorna payload enriquecido
    return {
      ...payload,
      id: payload.sub,
      role: user.role, // Garante role atualizada do banco
    };
  }
}
