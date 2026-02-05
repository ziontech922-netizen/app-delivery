import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from '@shared/filters';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  
  // Prefixo global para todas as rotas da API
  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'health/(.*)'],
  });

  // Filter global de exceções
  app.useGlobalFilters(new AllExceptionsFilter());

  // Validação global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS configurável
  const corsOrigins = configService.get<string>('CORS_ORIGINS', '*');
  app.enableCors({
    origin: corsOrigins === '*' ? '*' : corsOrigins.split(','),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  const port = configService.get<number>('PORT', 3000);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  
  await app.listen(port, '0.0.0.0');
  
  logger.log(`🚀 Application is running on port ${port}`);
  logger.log(`📍 Environment: ${nodeEnv}`);
  logger.log(`❤️  Health check: http://localhost:${port}/health`);
}

bootstrap();
