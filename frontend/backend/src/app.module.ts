import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TenantsModule } from './tenants/tenants.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { MediaModule } from './media/media.module';
import { ContactModule } from './contact/contact.module';
import { QualityImagesModule } from './quality-images/quality-images.module';
import { BundlesModule } from './bundles/bundles.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    TenantsModule,
    CategoriesModule,
    ProductsModule,
    CartModule,
    OrdersModule,
    QualityImagesModule,
    BundlesModule,
    MediaModule,
    ContactModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
  ],
})
export class AppModule {}
