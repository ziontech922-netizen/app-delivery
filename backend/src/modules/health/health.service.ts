import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@shared/prisma';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  checks: {
    database: {
      status: 'up' | 'down';
      responseTime?: number;
    };
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime: Date;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.startTime = new Date();
  }

  async check(): Promise<HealthCheckResult> {
    const databaseCheck = await this.checkDatabase();

    const allHealthy = databaseCheck.status === 'up';

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: this.configService.get<string>('APP_VERSION', '0.1.0'),
      environment: this.configService.get<string>('NODE_ENV', 'development'),
      uptime: this.getUptimeSeconds(),
      checks: {
        database: databaseCheck,
      },
    };
  }

  private async checkDatabase(): Promise<{ status: 'up' | 'down'; responseTime?: number }> {
    const startTime = Date.now();

    try {
      const isHealthy = await this.prisma.isHealthy();
      const responseTime = Date.now() - startTime;

      if (isHealthy) {
        return { status: 'up', responseTime };
      }

      this.logger.warn('Database health check returned false');
      return { status: 'down' };
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return { status: 'down' };
    }
  }

  private getUptimeSeconds(): number {
    return Math.floor((Date.now() - this.startTime.getTime()) / 1000);
  }
}
