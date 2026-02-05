import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from '@shared/prisma';
import { RegisterDto, LoginDto } from './dto';
import { JwtPayload } from './strategies/jwt.strategy';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    status: UserStatus;
  };
  tokens: AuthTokens;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Registra um novo usuário
   */
  async register(dto: RegisterDto): Promise<AuthResponse> {
    // Verificar se e-mail já existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('E-mail já cadastrado');
    }

    // Hash da senha com Argon2
    const passwordHash = await this.hashPassword(dto.password);

    // Criar usuário
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: dto.role || UserRole.CUSTOMER,
        status: UserStatus.PENDING_VERIFICATION,
        acceptedTermsAt: dto.acceptedTerms ? new Date() : null,
        acceptedPrivacyAt: dto.acceptedPrivacy ? new Date() : null,
      },
    });

    this.logger.log(`Novo usuário registrado: ${user.id} (${user.email})`);

    // Gerar tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
      },
      tokens,
    };
  }

  /**
   * Login do usuário
   */
  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Verificar status do usuário
    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Conta suspensa. Entre em contato com o suporte.');
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException('Conta inativa');
    }

    // Verificar senha
    const isPasswordValid = await this.verifyPassword(user.passwordHash, dto.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Atualizar último login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    this.logger.log(`Login: ${user.id} (${user.email})`);

    // Gerar tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
      },
      tokens,
    };
  }

  /**
   * Refresh do access token
   */
  async refresh(refreshToken: string): Promise<AuthTokens> {
    // Hash do refresh token para buscar no banco
    const tokenHash = this.hashRefreshToken(refreshToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: tokenHash },
      include: { user: true },
    });

    if (!storedToken) {
      throw new ForbiddenException('Refresh token inválido');
    }

    if (storedToken.revokedAt) {
      throw new ForbiddenException('Refresh token revogado');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new ForbiddenException('Refresh token expirado');
    }

    // Verificar status do usuário
    if (storedToken.user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Conta suspensa');
    }

    // Revogar token atual (rotação de tokens)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Gerar novos tokens
    const tokens = await this.generateTokens(
      storedToken.user.id,
      storedToken.user.email,
      storedToken.user.role,
    );

    this.logger.log(`Token refreshed: ${storedToken.user.id}`);

    return tokens;
  }

  /**
   * Logout - revoga refresh token
   */
  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashRefreshToken(refreshToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: tokenHash },
    });

    if (storedToken && !storedToken.revokedAt) {
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });
    }

    this.logger.log('Logout realizado');
  }

  /**
   * Logout de todos os dispositivos
   */
  async logoutAll(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    this.logger.log(`Logout de todos os dispositivos: ${userId}`);
  }

  /**
   * Retorna dados do usuário atual
   */
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return user;
  }

  /**
   * Gera par de tokens (access + refresh)
   */
  private async generateTokens(
    userId: string,
    email: string,
    role: UserRole,
  ): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: userId,
      email,
      role,
    };

    const accessExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '15m');
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');

    // Gerar access token
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: accessExpiresIn,
    });

    // Gerar refresh token (token opaco)
    const refreshToken = this.generateRefreshToken();
    const refreshTokenHash = this.hashRefreshToken(refreshToken);

    // Calcular expiração do refresh token
    const refreshExpiresAt = this.calculateExpiration(refreshExpiresIn);

    // Salvar refresh token hasheado no banco
    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenHash,
        userId,
        expiresAt: refreshExpiresAt,
      },
    });

    // Limpar tokens expirados do usuário (housekeeping)
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { not: null } }],
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpirationToSeconds(accessExpiresIn),
    };
  }

  /**
   * Gera refresh token opaco
   */
  private generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Hash do refresh token para armazenamento
   */
  private hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Hash da senha com Argon2
   */
  private async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
  }

  /**
   * Verifica senha com Argon2
   */
  private async verifyPassword(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  /**
   * Calcula data de expiração a partir de string (ex: '7d', '15m')
   */
  private calculateExpiration(expiresIn: string): Date {
    const now = Date.now();
    const ms = this.parseExpirationToMs(expiresIn);
    return new Date(now + ms);
  }

  /**
   * Converte string de expiração para milissegundos
   */
  private parseExpirationToMs(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 15 * 60 * 1000; // default 15 minutos
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 15 * 60 * 1000;
    }
  }

  /**
   * Converte string de expiração para segundos
   */
  private parseExpirationToSeconds(expiresIn: string): number {
    return Math.floor(this.parseExpirationToMs(expiresIn) / 1000);
  }
}
