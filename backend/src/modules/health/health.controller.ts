import { Controller, Get } from '@nestjs/common';
import { HealthService, HealthCheckResult } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Health check básico - sempre retorna OK se a aplicação está rodando
   */
  @Get()
  check(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Health check detalhado - verifica todas as dependências
   */
  @Get('details')
  async checkDetailed(): Promise<HealthCheckResult> {
    return this.healthService.check();
  }

  /**
   * Readiness probe - verifica se a aplicação está pronta para receber tráfego
   */
  @Get('ready')
  async ready(): Promise<{ ready: boolean }> {
    const health = await this.healthService.check();
    return { ready: health.status === 'healthy' };
  }

  /**
   * Liveness probe - verifica se a aplicação está viva
   */
  @Get('live')
  live(): { alive: boolean } {
    return { alive: true };
  }
}
