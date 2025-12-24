import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  });

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Hệ thống Kế toán Doanh nghiệp')
    .setDescription('API Documentation cho hệ thống kế toán doanh nghiệp Việt Nam')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Xác thực và phân quyền')
    .addTag('settings', 'Cài đặt hệ thống')
    .addTag('products', 'Quản lý sản phẩm')
    .addTag('customers', 'Quản lý khách hàng')
    .addTag('suppliers', 'Quản lý nhà cung cấp')
    .addTag('inventory', 'Quản lý kho vận')
    .addTag('employees', 'Quản lý nhân sự')
    .addTag('invoices', 'Hóa đơn VAT')
    .addTag('accounting', 'Kế toán tổng hợp')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
