import express, { Express, Request, Response } from 'express';
import path from 'path';
import { createDashboardRouter, DashboardApiConfig } from './dashboard-api';
import { JobStatus } from '@townkrier/queue';
import { NotificationChannel } from '@townkrier/core';
import { NotificationLogStatus } from '@townkrier/storage';

/**
 * Dashboard configuration for middleware/integration mode
 */
export interface DashboardConfig extends DashboardApiConfig {
  path?: string;
  auth?: {
    enabled: boolean;
    username: string;
    password: string;
  };
  logger?: {
    log: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
    warn: (message: string, ...args: unknown[]) => void;
  };
}

/**
 * Dashboard server configuration (standalone mode)
 */
export interface DashboardServerConfig extends DashboardConfig {
  port?: number;
}

/**
 * Setup dashboard routes and middleware on an existing Express app
 * Use this to integrate the dashboard into your existing application
 *
 * @example
 * ```typescript
 * const app = express();
 *
 * setupDashboard(app, {
 *   queueManager,
 *   storageManager,
 *   path: '/dashboard',
 * });
 *
 * app.listen(3000);
 * ```
 */
export function setupDashboard(app: Express, config: DashboardConfig): void {
  const basePath = config.path || '/townkrier/dashboard';

  // Use provided logger or fallback to console
  const logger = config.logger || {
    log: console.log.bind(console),
    error: console.error.bind(console),
    warn: console.warn.bind(console),
  };

  logger.log(`Setting up dashboard at path: ${basePath}`);

  // Setup view engine if not already configured
  if (!app.get('view engine')) {
    app.set('view engine', 'ejs');
  }

  // Add views directory
  const existingViews = app.get('views');
  const dashboardViews = path.join(__dirname, '../views');

  if (existingViews) {
    // If views already configured, add dashboard views to the array
    const viewsArray = Array.isArray(existingViews) ? existingViews : [existingViews];
    if (!viewsArray.includes(dashboardViews)) {
      app.set('views', [...viewsArray, dashboardViews]);
    }
  } else {
    app.set('views', dashboardViews);
  }

  // Setup basic authentication if enabled
  if (config.auth?.enabled) {
    app.use(basePath, (req, res, next) => {
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

      if (username === config.auth?.username && password === config.auth?.password) {
        next();
      } else {
        res.setHeader('WWW-Authenticate', 'Basic realm="Dashboard"');
        res.status(401).json({ error: 'Invalid credentials' });
      }
    });
  }

  // Dashboard API routes - mount BEFORE UI routes to prevent conflicts
  const dashboardRouter = createDashboardRouter({
    queueManager: config.queueManager,
    storageManager: config.storageManager,
  });

  // Mount API routes at basePath (e.g., /townkrier/dashboard/api/*)
  app.use(basePath, dashboardRouter);

  // Dashboard UI routes - mount AFTER API routes
  // Home page
  app.get(basePath, async (req: Request, res: Response) => {
    try {
      const stats = await getStats(config);
      const jobs = await config.queueManager.getJobs({ limit: 10 });
      const logsResult = await config.storageManager.queryLogs({ limit: 10 });

      res.render('pages/home', {
        title: 'Overview',
        page: 'home',
        basePath,
        stats,
        jobs,
        logs: logsResult.logs,
      });
    } catch (error) {
      logger.error('Error loading dashboard home page:', error);
      res.status(500).send('Error loading dashboard');
    }
  });

  // Jobs list page
  app.get(`${basePath}/jobs`, async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const jobs = await config.queueManager.getJobs({
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
      logger.error('Error loading jobs list:', error);
      res.status(500).send('Error loading jobs');
    }
  });

  // Job detail page
  app.get(`${basePath}/jobs/:id`, async (req: Request, res: Response) => {
    try {
      const job = await config.queueManager.getJob(req.params.id);

      if (!job) {
        logger.warn(`Job not found: ${req.params.id}`);
        return res.status(404).send('Job not found');
      }

      res.render('pages/job-detail', {
        title: 'Job Details',
        page: 'jobs',
        basePath,
        job,
      });
    } catch (error) {
      logger.error(`Error loading job ${req.params.id}:`, error);
      res.status(500).send('Error loading job');
    }
  });

  // Logs list page
  app.get(`${basePath}/logs`, async (req: Request, res: Response) => {
    try {
      const channel = req.query.channel as string | undefined;
      const status = req.query.status as string | undefined;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await config.storageManager.queryLogs({
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
      logger.error('Error loading logs list:', error);
      res.status(500).send('Error loading logs');
    }
  });

  // Log detail page
  app.get(`${basePath}/logs/:id`, async (req: Request, res: Response) => {
    try {
      const log = await config.storageManager.getLog(req.params.id);

      if (!log) {
        logger.warn(`Log not found: ${req.params.id}`);
        return res.status(404).send('Log not found');
      }

      res.render('pages/log-detail', {
        title: 'Notification Details',
        page: 'logs',
        basePath,
        log,
      });
    } catch (error) {
      logger.error(`Error loading log ${req.params.id}:`, error);
      res.status(500).send('Error loading log');
    }
  });

  // Analysis page
  app.get(`${basePath}/analysis`, async (req: Request, res: Response) => {
    try {
      const stats = await getStats(config);

      res.render('pages/analysis', {
        title: 'Delivery Analysis',
        page: 'analysis',
        basePath,
        stats,
      });
    } catch (error) {
      logger.error('Error loading analysis page:', error);
      res.status(500).send('Error loading analysis');
    }
  });

  logger.log(`✅ Dashboard successfully mounted at ${basePath}`);
}

/**
 * Get combined statistics
 */
async function getStats(config: DashboardConfig): Promise<{
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
  const queueStats = await config.queueManager.getStats();
  const storageStats = await config.storageManager.getStats();

  return {
    queue: queueStats,
    notifications: storageStats,
    timestamp: new Date(),
  };
}

/**
 * Dashboard server for monitoring notifications (Standalone Mode)
 * Similar to Hangfire dashboard with EJS templates
 *
 * @deprecated Use setupDashboard() to integrate with your existing Express app instead.
 * This class is kept for backward compatibility.
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
    this.setupMiddleware();

    // Use the setupDashboard function to configure routes
    setupDashboard(this.app, this.config);
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
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
