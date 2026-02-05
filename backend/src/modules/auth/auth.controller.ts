import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService, AuthResponse, AuthTokens } from './auth.service';
import { RegisterDto, LoginDto, RefreshDto } from './dto';
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
}
