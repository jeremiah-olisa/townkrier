import express, { Express, Request, Response } from 'express';
import path from 'path';
import { createDashboardRouter, DashboardApiConfig } from './dashboard-api';
import { JobStatus } from '@townkrier/queue';
import { NotificationChannel } from '@townkrier/core';
import { NotificationLogStatus } from '@townkrier/storage';

/**
 * Dashboard server configuration
 */
export interface DashboardServerConfig extends DashboardApiConfig {
  port?: number;
  path?: string;
  auth?: {
    enabled: boolean;
    username: string;
    password: string;
  };
}

/**
 * Dashboard server for monitoring notifications
 * Similar to Hangfire dashboard with EJS templates
 */
export class DashboardServer {
  private app: Express;
  private config: DashboardServerConfig;
  private server?: ReturnType<Express['listen']>;

  constructor(config: DashboardServerConfig) {
    this.config = {
      port: 3000,
      path: '/townkrier/dashboard',
      ...config,
    };
    this.app = express();
    this.setupViewEngine();
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup EJS view engine
   */
  private setupViewEngine(): void {
    this.app.set('view engine', 'ejs');
    this.app.set('views', path.join(__dirname, '../views'));
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Basic authentication if enabled
    if (this.config.auth?.enabled) {
      this.app.use((req, res, next) => {
        const auth = req.headers.authorization;

        if (!auth) {
          res.setHeader('WWW-Authenticate', 'Basic realm="Dashboard"');
          return res.status(401).json({ error: 'Authentication required' });
        }

        const [scheme, credentials] = auth.split(' ');
        if (scheme !== 'Basic') {
          return res.status(401).json({ error: 'Invalid authentication scheme' });
        }

        const [username, password] = Buffer.from(credentials, 'base64').toString().split(':');

        if (username === this.config.auth?.username && password === this.config.auth?.password) {
          next();
        } else {
          res.setHeader('WWW-Authenticate', 'Basic realm="Dashboard"');
          res.status(401).json({ error: 'Invalid credentials' });
        }
      });
    }
  }

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    const basePath = this.config.path!;

    // Dashboard API routes
    const dashboardRouter = createDashboardRouter({
      queueManager: this.config.queueManager,
      storageManager: this.config.storageManager,
    });

    this.app.use(basePath, dashboardRouter);

    // Dashboard UI routes
    // Home page
    this.app.get(basePath, async (req: Request, res: Response) => {
      try {
        const stats = await this.getStats();
        const jobs = await this.config.queueManager.getJobs({ limit: 10 });
        const logsResult = await this.config.storageManager.queryLogs({ limit: 10 });

        res.render('pages/home', {
          title: 'Overview',
          page: 'home',
          basePath,
          stats,
          jobs,
          logs: logsResult.logs,
        });
      } catch (error) {
        res.status(500).send('Error loading dashboard');
      }
    });

    // Jobs list page
    this.app.get(`${basePath}/jobs`, async (req: Request, res: Response) => {
      try {
        const status = req.query.status as string | undefined;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        const jobs = await this.config.queueManager.getJobs({
          status: status as JobStatus | undefined,
          limit,
          offset,
        });

        res.render('pages/jobs', {
          title: 'Jobs',
          page: 'jobs',
          basePath,
          jobs,
          status,
          limit,
          offset,
        });
      } catch (error) {
        res.status(500).send('Error loading jobs');
      }
    });

    // Job detail page
    this.app.get(`${basePath}/jobs/:id`, async (req: Request, res: Response) => {
      try {
        const job = await this.config.queueManager.getJob(req.params.id);

        if (!job) {
          return res.status(404).send('Job not found');
        }

        res.render('pages/job-detail', {
          title: 'Job Details',
          page: 'jobs',
          basePath,
          job,
        });
      } catch (error) {
        res.status(500).send('Error loading job');
      }
    });

    // Logs list page
    this.app.get(`${basePath}/logs`, async (req: Request, res: Response) => {
      try {
        const channel = req.query.channel as string | undefined;
        const status = req.query.status as string | undefined;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        const result = await this.config.storageManager.queryLogs({
          channel: channel as NotificationChannel | undefined,
          status: status as NotificationLogStatus | undefined,
          limit,
          offset,
        });

        res.render('pages/logs', {
          title: 'Notification Logs',
          page: 'logs',
          basePath,
          logs: result.logs,
          channel,
          status,
          limit,
          offset,
        });
      } catch (error) {
        res.status(500).send('Error loading logs');
      }
    });

    // Log detail page
    this.app.get(`${basePath}/logs/:id`, async (req: Request, res: Response) => {
      try {
        const log = await this.config.storageManager.getLog(req.params.id);

        if (!log) {
          return res.status(404).send('Log not found');
        }

        res.render('pages/log-detail', {
          title: 'Notification Details',
          page: 'logs',
          basePath,
          log,
        });
      } catch (error) {
        res.status(500).send('Error loading log');
      }
    });

    // Analysis page
    this.app.get(`${basePath}/analysis`, async (req: Request, res: Response) => {
      try {
        const stats = await this.getStats();

        res.render('pages/analysis', {
          title: 'Delivery Analysis',
          page: 'analysis',
          basePath,
          stats,
        });
      } catch (error) {
        res.status(500).send('Error loading analysis');
      }
    });
  }

  /**
   * Get combined statistics
   */
  private async getStats(): Promise<{
    queue: {
      pending: number;
      processing: number;
      completed: number;
      failed: number;
      retrying: number;
      scheduled: number;
    };
    notifications: {
      total: number;
      sent: number;
      delivered?: number;
      failed: number;
      retrying?: number;
      byChannel?: Record<string, number>;
      byStatus?: Record<string, number>;
    };
    timestamp: Date;
  }> {
    const queueStats = await this.config.queueManager.getStats();
    const storageStats = await this.config.storageManager.getStats();

    return {
      queue: queueStats,
      notifications: storageStats,
      timestamp: new Date(),
    };
  }

  /**
   * Start the dashboard server
   */
  start(): void {
    this.server = this.app.listen(this.config.port, () => {
      console.log(
        `Dashboard server started on http://localhost:${this.config.port}${this.config.path}`,
      );
    });
  }

  /**
   * Stop the dashboard server
   */
  stop(): void {
    if (this.server) {
      this.server.close();
      console.log('Dashboard server stopped');
    }
  }

  /**
   * Get the Express app instance
   */
  getApp(): Express {
    return this.app;
  }
}
