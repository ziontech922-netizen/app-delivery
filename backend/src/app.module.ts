import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@shared/prisma/prisma.module';
import { RedisModule } from '@shared/redis/redis.module';
import { HealthModule } from '@modules/health/health.module';
import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { MerchantsModule } from '@modules/merchants/merchants.module';
import { ProductsModule } from '@modules/products/products.module';
import { OrdersModule } from '@modules/orders/orders.module';
import { RealtimeModule } from '@modules/realtime/realtime.module';

@Module({
  imports: [
    // Configuração global de variáveis de ambiente
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    
    // Módulo Prisma (banco de dados)
    PrismaModule,
    
    // Módulo Redis (cache + pub/sub)
    RedisModule,
    
    // Módulo de Health Check
    HealthModule,
    
    // Módulos de autenticação e usuários
    AuthModule,
    UsersModule,
    
    // Módulos de domínio - ETAPA 3
    MerchantsModule,
    ProductsModule,
    OrdersModule,
    
    // Realtime - ETAPA 4
    RealtimeModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
