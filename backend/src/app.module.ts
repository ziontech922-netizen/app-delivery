import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@shared/prisma/prisma.module';
import { HealthModule } from '@modules/health/health.module';

@Module({
  imports: [
    // Configuração global de variáveis de ambiente
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    
    // Módulo Prisma (banco de dados)
    PrismaModule,
    
    // Módulo de Health Check
    HealthModule,
    
    // Módulos de domínio serão adicionados conforme as etapas
    // AuthModule,
    // UsersModule,
    // MerchantsModule,
    // ProductsModule,
    // OrdersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
