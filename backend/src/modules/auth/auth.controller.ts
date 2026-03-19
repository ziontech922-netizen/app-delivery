import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService, AuthResponse, AuthTokens } from './auth.service';
import { 
  RegisterDto, 
  LoginDto, 
  RefreshDto,
  SendOtpDto,
  VerifyOtpDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  SocialAuthDto,
  SetPasswordDto,
} from './dto';
import { Auth, CurrentUser } from './decorators';
import { JwtPayload } from './strategies/jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/v1/auth/register
   * Cadastro de novo usuário
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(dto);
  }

  /**
   * POST /api/v1/auth/login
   * Login do usuário
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(dto);
  }

  /**
   * POST /api/v1/auth/refresh
   * Refresh do access token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshDto): Promise<AuthTokens> {
    return this.authService.refresh(dto.refreshToken);
  }

  /**
   * POST /api/v1/auth/logout
   * Logout (revoga refresh token)
   */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() dto: RefreshDto): Promise<void> {
    return this.authService.logout(dto.refreshToken);
  }

  /**
   * POST /api/v1/auth/logout-all
   * Logout de todos os dispositivos
   */
  @Post('logout-all')
  @Auth()
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutAll(@CurrentUser('id') userId: string): Promise<void> {
    return this.authService.logoutAll(userId);
  }

  /**
   * GET /api/v1/auth/me
   * Retorna dados do usuário autenticado
   */
  @Get('me')
  @Auth()
  async me(@CurrentUser() user: JwtPayload) {
    return this.authService.getMe(user.sub);
  }

  // ====================
  // OTP ENDPOINTS
  // ====================

  /**
   * POST /api/v1/auth/otp/send
   * Envia código OTP para o telefone
   */
  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto.phone, dto.type);
  }

  /**
   * POST /api/v1/auth/otp/verify
   * Verifica código OTP
   */
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.phone, dto.code);
  }

  // ====================
  // PASSWORD RECOVERY
  // ====================

  /**
   * POST /api/v1/auth/forgot-password
   * Solicita recuperação de senha
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  /**
   * GET /api/v1/auth/validate-reset-token/:token
   * Valida token de recuperação
   */
  @Get('validate-reset-token/:token')
  async validateResetToken(@Param('token') token: string) {
    return this.authService.validateResetToken(token);
  }

  /**
   * POST /api/v1/auth/reset-password
   * Reseta a senha do usuário
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  // ====================
  // SET PASSWORD (for OAuth users)
  // ====================

  /**
   * POST /api/v1/auth/set-password
   * Define senha para usuários que entraram via OAuth
   */
  @Post('set-password')
  @Auth()
  @HttpCode(HttpStatus.OK)
  async setPassword(
    @Body() dto: SetPasswordDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.authService.setPassword(userId, dto.newPassword);
  }

  // ====================
  // SOCIAL AUTH
  // ====================

  /**
   * POST /api/v1/auth/social
   * Autenticação social (Google, Apple, Facebook)
   */
  @Post('social')
  @HttpCode(HttpStatus.OK)
  async socialAuth(@Body() dto: SocialAuthDto): Promise<AuthResponse> {
    return this.authService.socialAuth(dto.provider, dto.idToken, dto.userData);
  }

  // ====================
  // EMERGENCY ADMIN RESTORE
  // ====================

  /**
   * POST /api/v1/auth/emergency/restore-admin
   * Restaura role de admin em caso de emergência
   */
  @Post('emergency/restore-admin')
  @HttpCode(HttpStatus.OK)
  async emergencyRestoreAdmin(
    @Body() body: { email: string; secretKey: string },
  ) {
    const EMERGENCY_KEY = process.env.EMERGENCY_ADMIN_KEY || 'SUPERAPP_EMERGENCY_2026';
    
    if (body.secretKey !== EMERGENCY_KEY) {
      return { success: false, message: 'Invalid secret key' };
    }

    return this.authService.emergencyRestoreAdmin(body.email);
  }

  /**
   * POST /api/v1/auth/emergency/clean-admin
   * Remove qualquer merchant associado ao admin e restaura role
   */
  @Post('emergency/clean-admin')
  @HttpCode(HttpStatus.OK)
  async emergencyCleanAdmin(
    @Body() body: { email: string; secretKey: string },
  ) {
    const EMERGENCY_KEY = process.env.EMERGENCY_ADMIN_KEY || 'SUPERAPP_EMERGENCY_2026';
    
    if (body.secretKey !== EMERGENCY_KEY) {
      return { success: false, message: 'Invalid secret key' };
    }

    return this.authService.emergencyCleanAdmin(body.email);
  }
}
