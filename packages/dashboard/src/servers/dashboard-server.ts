import express, { Express, Request, Response } from 'express';
import path from 'path';
import { createDashboardRouter } from './dashboard-api';
import {
  homeRoute,
  jobsListRoute,
  jobDetailRoute,
  logsListRoute,
  logDetailRoute,
  analysisRoute,
} from '../routes';
import type { DashboardServerConfig, DashboardConfig, DashboardStats } from '../types';

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
  app.get(basePath, (req: Request, res: Response) =>
    homeRoute(req, res, config, logger, basePath, getStats),
  );

  // Jobs list page
  app.get(`${basePath}/jobs`, (req: Request, res: Response) =>
    jobsListRoute(req, res, config, logger, basePath),
  );

  // Job detail page
  app.get(`${basePath}/jobs/:id`, (req: Request, res: Response) =>
    jobDetailRoute(req, res, config, logger, basePath),
  );

  // Logs list page
  app.get(`${basePath}/logs`, (req: Request, res: Response) =>
    logsListRoute(req, res, config, logger, basePath),
  );

  // Log detail page
  app.get(`${basePath}/logs/:id`, (req: Request, res: Response) =>
    logDetailRoute(req, res, config, logger, basePath),
  );

  // Analysis page
  app.get(`${basePath}/analysis`, (req: Request, res: Response) =>
    analysisRoute(req, res, config, logger, basePath, getStats),
  );

  logger.log(`✅ Dashboard successfully mounted at ${basePath}`);
}

/**
 * Get combined statistics
 */
async function getStats(config: DashboardConfig): Promise<DashboardStats> {
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
