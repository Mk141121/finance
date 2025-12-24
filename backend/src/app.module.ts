import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { SettingsModule } from './settings/settings.module';
import { ProductsModule } from './products/products.module';
import { CustomersModule } from './customers/customers.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { QuotationsModule } from './quotations/quotations.module';
import { SalesOrdersModule } from './sales-orders/sales-orders.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { InventoryModule } from './inventory/inventory.module';
import { AccountingModule } from './accounting/accounting.module';
import { EInvoicesModule } from './e-invoices/e-invoices.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { UserTenant } from './tenants/entities/user-tenant.entity';

@Module({
  imports: [
    // Config module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database module
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // Đã có schema rồi, không cần sync
        logging: configService.get('NODE_ENV') === 'development',
      }),
    }),

    // For middleware
    TypeOrmModule.forFeature([UserTenant]),

    // Feature modules
    AuthModule,
    TenantsModule,
    SettingsModule,
    ProductsModule,
    CustomersModule,
    SuppliersModule,
    QuotationsModule,
    SalesOrdersModule,
    PurchaseOrdersModule,
    InventoryModule,
    AccountingModule,
    EInvoicesModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/register', method: RequestMethod.POST },
        { path: 'auth/refresh', method: RequestMethod.POST },
      )
      .forRoutes('*');
  }
}
