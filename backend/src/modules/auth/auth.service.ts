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
import { SmsService } from '../notifications/sms.service';
import { EmailService } from '../notifications/email.service';
import { OAuthService, OAuthUserData } from './services/oauth.service';
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
    private readonly smsService: SmsService,
    private readonly emailService: EmailService,
    private readonly oauthService: OAuthService,
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
        passwordHash: true,
        googleId: true,
        appleId: true,
        facebookId: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      hasPassword: !!user.passwordHash && user.passwordHash !== '',
      hasSocialLogin: !!user.googleId || !!user.appleId || !!user.facebookId,
    };
  }

  /**
   * Permite que um usuário OAuth defina uma senha
   */
  async setPassword(userId: string, newPassword: string): Promise<{ success: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // Se já tem senha, não permite usar este endpoint (deve usar change-password)
    if (user.passwordHash && user.passwordHash !== '') {
      throw new ConflictException('Usuário já possui senha. Use a opção de alterar senha.');
    }

    const passwordHash = await this.hashPassword(newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    this.logger.log(`🔐 Password set for OAuth user: ${userId}`);

    return { success: true };
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

  // ====================
  // OTP METHODS
  // ====================

  /**
   * Envia código OTP por SMS/WhatsApp
   */
  async sendOtp(phone: string, type: 'sms' | 'whatsapp'): Promise<{ success: boolean; message: string }> {
    // Gerar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash do código para armazenamento
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    
    // Expiração em 5 minutos
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Salvar ou atualizar código no banco
    await this.prisma.otpCode.upsert({
      where: { phone },
      update: {
        code: codeHash,
        expiresAt,
        attempts: 0,
        verified: false,
      },
      create: {
        phone,
        code: codeHash,
        expiresAt,
        attempts: 0,
        verified: false,
      },
    });

    // Enviar SMS/WhatsApp via Twilio
    if (this.smsService.isAvailable()) {
      const result = await this.smsService.sendOtp(phone, code, type);
      
      if (!result.success) {
        this.logger.error(`Failed to send OTP to ${phone}: ${result.error}`);
        return { 
          success: false, 
          message: 'Erro ao enviar código. Tente novamente.' 
        };
      }
      
      this.logger.log(`📱 OTP sent to ${phone} via ${type}`);
    } else {
      // Fallback para desenvolvimento - apenas loga
      this.logger.warn(`📱 [DEV] OTP Code for ${phone}: ${code}`);
    }

    return { 
      success: true, 
      message: type === 'whatsapp' ? 'Código enviado via WhatsApp' : 'Código enviado via SMS' 
    };
  }

  /**
   * Verifica código OTP
   */
  async verifyOtp(phone: string, code: string): Promise<{ verified: boolean; token?: string }> {
    const otpRecord = await this.prisma.otpCode.findUnique({
      where: { phone },
    });

    if (!otpRecord) {
      return { verified: false };
    }

    // Verificar se expirou
    if (otpRecord.expiresAt < new Date()) {
      return { verified: false };
    }

    // Verificar tentativas (máximo 5)
    if (otpRecord.attempts >= 5) {
      return { verified: false };
    }

    // Incrementar tentativas
    await this.prisma.otpCode.update({
      where: { phone },
      data: { attempts: { increment: 1 } },
    });

    // Verificar código
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    
    if (codeHash !== otpRecord.code) {
      return { verified: false };
    }

    // Marcar como verificado
    await this.prisma.otpCode.update({
      where: { phone },
      data: { verified: true },
    });

    // Gerar token temporário para o registro
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Salvar token de verificação (expira em 30 minutos)
    await this.prisma.phoneVerification.upsert({
      where: { phone },
      update: {
        token: verificationToken,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
      create: {
        phone,
        token: verificationToken,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    this.logger.log(`✅ Phone verified: ${phone}`);

    return { verified: true, token: verificationToken };
  }

  // ====================
  // PASSWORD RECOVERY
  // ====================

  /**
   * Solicita recuperação de senha
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Sempre retorna sucesso para evitar enumeração de emails
    if (!user) {
      this.logger.log(`Password recovery requested for non-existent email: ${email}`);
      return { success: true, message: 'Se o email existir, você receberá o link de recuperação' };
    }

    // Gerar token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Salvar token no banco (expira em 1 hora)
    await this.prisma.passwordReset.upsert({
      where: { userId: user.id },
      update: {
        token: resetTokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        usedAt: null,
      },
      create: {
        userId: user.id,
        token: resetTokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    // Gerar URL de reset
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'https://superapp-web-beta.fly.dev';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    
    // Enviar email via SendGrid
    if (this.emailService.isAvailable()) {
      const userName = user.firstName || undefined;
      const result = await this.emailService.sendPasswordResetEmail(email, resetUrl, userName);
      
      if (!result.success) {
        this.logger.error(`Failed to send password reset email to ${email}: ${result.error}`);
        // Não retornamos erro para evitar enumeração
      } else {
        this.logger.log(`🔐 Password reset email sent to ${email}`);
      }
    } else {
      // Fallback para desenvolvimento - apenas loga
      this.logger.warn(`🔐 [DEV] Password reset link for ${email}: ${resetUrl}`);
    }

    return { success: true, message: 'Se o email existir, você receberá o link de recuperação' };
  }

  /**
   * Valida token de reset de senha
   */
  async validateResetToken(token: string): Promise<{ valid: boolean }> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetRecord = await this.prisma.passwordReset.findFirst({
      where: {
        token: tokenHash,
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
    });

    return { valid: !!resetRecord };
  }

  /**
   * Reseta a senha do usuário
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean }> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetRecord = await this.prisma.passwordReset.findFirst({
      where: {
        token: tokenHash,
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
      include: { user: true },
    });

    if (!resetRecord) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    // Hash da nova senha
    const passwordHash = await this.hashPassword(newPassword);

    // Atualizar senha do usuário
    await this.prisma.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash },
    });

    // Marcar token como usado
    await this.prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: { usedAt: new Date() },
    });

    // Revogar todos os refresh tokens do usuário
    await this.logoutAll(resetRecord.userId);

    this.logger.log(`🔐 Password reset for user: ${resetRecord.userId}`);

    return { success: true };
  }

  // ====================
  // SOCIAL AUTH
  // ====================

  /**
   * Autenticação social (Google, Apple, Facebook)
   */
  async socialAuth(
    provider: 'google' | 'apple' | 'facebook',
    idToken: string,
    userData?: { firstName?: string; lastName?: string },
  ): Promise<AuthResponse> {
    let oauthData: OAuthUserData;

    // Verify token with the appropriate provider
    switch (provider) {
      case 'google':
        oauthData = await this.oauthService.verifyGoogleToken(idToken);
        break;
      case 'apple':
        oauthData = await this.oauthService.verifyAppleToken(idToken, userData);
        break;
      case 'facebook':
        oauthData = await this.oauthService.verifyFacebookToken(idToken);
        break;
      default:
        throw new UnauthorizedException(`Provider ${provider} não suportado`);
    }

    // Find or create user
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: oauthData.email.toLowerCase() },
          { [`${provider}Id`]: oauthData.providerId },
        ],
      },
    });

    if (!user) {
      // Create new user
      user = await this.prisma.user.create({
        data: {
          email: oauthData.email.toLowerCase(),
          firstName: oauthData.firstName || 'Usuário',
          lastName: oauthData.lastName || '',
          [`${provider}Id`]: oauthData.providerId,
          role: UserRole.CUSTOMER,
          status: oauthData.emailVerified ? UserStatus.ACTIVE : UserStatus.PENDING_VERIFICATION,
          emailVerifiedAt: oauthData.emailVerified ? new Date() : null,
          profilePicture: oauthData.picture,
          passwordHash: '', // No password for social login
        },
      });

      this.logger.log(`New ${provider} user created: ${user.id} (${user.email})`);
    } else {
      // Update provider ID if not set
      if (!user[`${provider}Id`]) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            [`${provider}Id`]: oauthData.providerId,
            profilePicture: user.profilePicture || oauthData.picture,
          },
        });
      }

      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      this.logger.log(`${provider} login: ${user.id} (${user.email})`);
    }

    // Check user status
    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Conta suspensa. Entre em contato com o suporte.');
    }

    // Generate tokens
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
    //
    // let user = await this.prisma.user.findFirst({
    //   where: { OR: [{ email }, { googleId }] }
    // });
    //
    // if (!user) {
    //   user = await this.prisma.user.create({
    //     data: { email, firstName: name.split(' ')[0], googleId, status: 'ACTIVE' }
    //   });
    // }
    //
    // const tokens = await this.generateTokens(user.id, user.email, user.role);
    // return { user: { ... }, tokens };
  }

  /**
   * Emergency restore admin role
   */
  async emergencyRestoreAdmin(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { role: UserRole.ADMIN },
    });

    this.logger.warn(`EMERGENCY: Admin role restored for ${email}`);

    return {
      success: true,
      message: `Admin role restored for ${email}`,
      userId: user.id,
      previousRole: user.role,
      newRole: 'ADMIN',
    };
  }

  /**
   * Emergency clean admin - remove qualquer merchant e restaura role
   */
  async emergencyCleanAdmin(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { merchant: true },
    });

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const result: any = {
      success: true,
      userId: user.id,
      email: user.email,
      previousRole: user.role,
      merchantRemoved: false,
    };

    // Se existe merchant associado, deletar permanentemente
    if (user.merchant) {
      // Deletar produtos do merchant
      await this.prisma.product.deleteMany({
        where: { merchantId: user.merchant.id },
      });

      // Deletar categorias do merchant
      await this.prisma.category.deleteMany({
        where: { merchantId: user.merchant.id },
      });

      // Deletar o merchant
      await this.prisma.merchant.delete({
        where: { id: user.merchant.id },
      });

      result.merchantRemoved = true;
      result.merchantId = user.merchant.id;
      result.merchantName = user.merchant.businessName;

      this.logger.warn(`EMERGENCY: Merchant ${user.merchant.id} permanently deleted for admin ${email}`);
    }

    // Restaurar role para ADMIN
    await this.prisma.user.update({
      where: { id: user.id },
      data: { role: UserRole.ADMIN },
    });

    result.newRole = 'ADMIN';
    result.message = result.merchantRemoved 
      ? `Admin limpo: merchant removido e role restaurado para ${email}`
      : `Admin limpo: role restaurado para ${email} (não havia merchant)`;

    this.logger.warn(`EMERGENCY: Admin cleaned for ${email}`);

    return result;
  }
}