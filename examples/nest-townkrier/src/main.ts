/**
 * NestJS TownKrier Integration Example - Main Entry Point
 *
 * This file bootstraps the NestJS application with:
 * - TownKrier notification system with multiple channels
 * - Queue management for background processing
 * - Dashboard UI for monitoring notifications (similar to Hangfire)
 * - Global validation pipe
 * - Swagger documentation
 * - CORS configuration
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
    .setTitle('TownKrier Notification API')
    .setDescription(
      'Multi-channel notification system with queue management and monitoring',
    )
    .setVersion('1.0')
    .addTag('notifications', 'Send notifications across multiple channels')
    .addTag('queue', 'Queue management and monitoring')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  const dashboardPath = process.env.DASHBOARD_PATH || '/townkrier/dashboard';
  const dashboardStandalone = process.env.DASHBOARD_STANDALONE === 'true';
  const dashboardPort = process.env.DASHBOARD_PORT || 4000;

  await app.listen(port);

  console.log('='.repeat(80));
  console.log('🚀 NestJS TownKrier Notification System');
  console.log('='.repeat(80));
  console.log(`📡 API Server:              http://localhost:${port}`);
  console.log(`📚 Swagger Documentation:   http://localhost:${port}/api`);

  if (dashboardStandalone) {
    console.log(
      `📊 TownKrier Dashboard:     http://localhost:${dashboardPort}${dashboardPath} (Standalone)`,
    );
  } else {
    console.log(
      `📊 TownKrier Dashboard:     http://localhost:${port}${dashboardPath} (Integrated)`,
    );
  }

  console.log('='.repeat(80));
  console.log('Available Features:');
  console.log('  ✅ Multi-channel notifications (Email, SMS, Push, etc.)');
  console.log('  ✅ Queue system with retry logic');
  console.log('  ✅ Background job processing');
  console.log('  ✅ Real-time monitoring dashboard');
  console.log('  ✅ Notification history and logs');
  console.log('='.repeat(80));
  console.log('\nAvailable Endpoints:');
  console.log(
    `  POST   http://localhost:${port}/notifications/send       - Send notification immediately`,
  );
  console.log(
    `  POST   http://localhost:${port}/notifications/queue      - Queue notification`,
  );
  console.log(
    `  POST   http://localhost:${port}/notifications/bulk       - Send bulk notifications`,
  );
  console.log(
    `  GET    http://localhost:${port}/queue/stats              - Get queue statistics`,
  );
  console.log(
    `  GET    http://localhost:${port}/queue/jobs               - List all jobs`,
  );
  console.log('='.repeat(80));
  console.log(
    '\n💡 Tip: Visit the dashboard to monitor notifications in real-time!',
  );
  console.log('');
}

bootstrap()
  .then(() => {
    // Application started successfully
  })
  .catch((err) => {
    console.error('❌ Error starting application:', err);
    process.exit(1);
  });
