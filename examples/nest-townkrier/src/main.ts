/**
 * NestJS Single Gateway Example - Main Entry Point
 *
 * This file bootstraps the NestJS application with:
 * - Global validation pipe
 * - Swagger documentation
 * - CORS configuration
 * - Global exception filters
 */

import { NestFactory } from '@nestjs/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app: INestApplication = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties
      forbidNonWhitelisted: true, // Throw error on unknown properties
      transform: true, // Transform to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Payment Gateway API')
    .setDescription('Single gateway payment integration with Paystack')
    .setVersion('1.0')
    .addTag('payments')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log('='.repeat(60));
  console.log('🚀 NestJS Single Gateway Example');
  console.log('='.repeat(60));
  console.log(`Application running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api`);
  console.log(`Gateway: Paystack`);
  console.log('='.repeat(60));
}

bootstrap()
  .then(() => {
    // Application started
  })
  .catch((err) => {
    console.error('Error starting application:', err);
  });
