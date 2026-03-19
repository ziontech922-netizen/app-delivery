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
import { CouponsModule } from '@modules/coupons/coupons.module';
import { DriverMatchingModule } from '@modules/driver-matching/driver-matching.module';
import { EtaModule } from '@modules/eta/eta.module';
import { PlatformFeeModule } from '@modules/platform-fees/platform-fee.module';

// Super App - Novos Módulos
import { ListingsModule } from '@modules/listings/listings.module';
import { ChatModule } from '@modules/chat/chat.module';
import { AiListingModule } from '@modules/ai-listing/ai-listing.module';
import { CommunityFeedModule } from '@modules/community-feed/community-feed.module';
import { SponsorsModule } from '@modules/sponsors/sponsors.module';

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

    // Coupons - Sistema de cupons
    CouponsModule,

    // Driver Matching - Sistema de atribuição de entregadores
    DriverMatchingModule,

    // ETA - Sistema de tempo estimado de entrega
    EtaModule,

    // Platform Fees - Sistema de taxas da plataforma
    PlatformFeeModule,

    // ===========================================
    // SUPER APP - Novos Módulos
    // ===========================================

    // Listings - Marketplace de anúncios
    ListingsModule,

    // Chat - Mensagens entre usuários
    ChatModule,

    // AI Listing - Criação inteligente de anúncios
    AiListingModule,

    // Community Feed - Feed da comunidade
    CommunityFeedModule,

    // Sponsors - Sistema de patrocinadores
    SponsorsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
