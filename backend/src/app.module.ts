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
import { PaymentsModule } from '@modules/payments/payments.module';
import { AdminModule } from '@modules/admin/admin.module';
import { DriversModule } from '@modules/drivers/drivers.module';
import { StorageModule } from '@modules/storage/storage.module';
import { ReviewsModule } from '@modules/reviews/reviews.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { SearchModule } from '@modules/search/search.module';

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
    
    // Payments - ETAPA 5
    PaymentsModule,
    
    // Admin - ETAPA 6
    AdminModule,
    
    // Drivers - ETAPA 7
    DriversModule,
    
    // Storage - Upload de imagens
    StorageModule,
    
    // Reviews - Avaliações
    ReviewsModule,
    
    // Notifications - Push e Email
    NotificationsModule,

    // Search - Busca full-text
    SearchModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
