import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { setupDashboard, DashboardServer } from 'townkrier-dashboard';
import { NotificationService } from './notification.service';

@Injectable()
export class DashboardService implements OnModuleInit {
  private readonly logger = new Logger(DashboardService.name);
  private dashboardServer?: DashboardServer;
  private useStandalone: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
    private readonly httpAdapterHost: HttpAdapterHost,
  ) {
    // Check if dashboard should run on separate port (standalone mode)
    this.useStandalone =
      this.configService.get<boolean>('DASHBOARD_STANDALONE') || false;
  }

  async onModuleInit() {
    const path =
      this.configService.get<string>('DASHBOARD_PATH') ||
      '/townkrier/dashboard';

    this.logger.log('Initializing TownKrier Dashboard...');

    try {
      if (this.useStandalone) {
        // Standalone mode: Run dashboard on separate port (backward compatible)
        const port = this.configService.get<number>('DASHBOARD_PORT') || 4000;

        this.dashboardServer = new DashboardServer({
          queueManager: this.notificationService.getQueueManager(),
          storageManager: this.notificationService.getStorageManager(),
          port,
          path,
          // Pass NestJS logger to dashboard
          logger: {
            log: (message: string, ...args: unknown[]) =>
              this.logger.log(message, ...args),
            error: (message: string, ...args: unknown[]) =>
              this.logger.error(message, ...args),
            warn: (message: string, ...args: unknown[]) =>
              this.logger.warn(message, ...args),
          },
          // Optional: Add authentication
          // auth: {
          //   enabled: true,
          //   username: this.configService.get<string>('DASHBOARD_USERNAME') || 'admin',
          //   password: this.configService.get<string>('DASHBOARD_PASSWORD') || 'admin',
          // },
        });

        await this.dashboardServer.start();
        this.logger.log(`✅ TownKrier Dashboard started in STANDALONE mode`);
        this.logger.log(`📊 Dashboard URL: http://localhost:${port}${path}`);
      } else {
        // Integrated mode: Use the same server instance (recommended)
        const httpAdapter = this.httpAdapterHost.httpAdapter;
        const app = httpAdapter.getInstance();

        if (!app) {
          this.logger.warn(
            'Express app not available. Dashboard not initialized.',
          );
          return;
        }

        setupDashboard(app, {
          queueManager: this.notificationService.getQueueManager(),
          storageManager: this.notificationService.getStorageManager(),
          path,
          // Pass NestJS logger to dashboard
          logger: {
            log: (message: string, ...args: unknown[]) =>
              this.logger.log(message, ...args),
            error: (message: string, ...args: unknown[]) =>
              this.logger.error(message, ...args),
            warn: (message: string, ...args: unknown[]) =>
              this.logger.warn(message, ...args),
          },
          // Optional: Add authentication
          // auth: {
          //   enabled: true,
          //   username: this.configService.get<string>('DASHBOARD_USERNAME') || 'admin',
          //   password: this.configService.get<string>('DASHBOARD_PASSWORD') || 'admin',
          // },
        });

        const port = this.configService.get<number>('PORT') || 3000;
        this.logger.log(`✅ TownKrier Dashboard integrated into application`);
        this.logger.log(`📊 Dashboard URL: http://localhost:${port}${path}`);
        this.logger.log(
          `💡 Set DASHBOARD_STANDALONE=true to run on separate port`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to initialize TownKrier Dashboard:', error);
    }
  }

  getDashboardServer(): DashboardServer | undefined {
    return this.dashboardServer;
  }
}
