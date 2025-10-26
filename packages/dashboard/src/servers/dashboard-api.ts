import { Router, Request, Response } from 'express';
import {
  statsRoute,
  jobsListApiRoute,
  jobDetailApiRoute,
  jobRetryRoute,
  jobDeleteRoute,
  logsListApiRoute,
  logDetailApiRoute,
  healthRoute,
} from '../routes/api';
import { DashboardApiConfig } from '../types';

/**
 * Create Express router for dashboard API
 */
export function createDashboardRouter(config: DashboardApiConfig): Router {
  const router = Router();

  // Middleware for JSON responses - only for API routes
  router.use('/api', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
  });

  /**
   * GET /api/stats - Get overall statistics
   */
  router.get('/api/stats', (req: Request, res: Response) => statsRoute(req, res, config));

  /**
   * GET /api/jobs - List jobs with filters
   */
  router.get('/api/jobs', (req: Request, res: Response) => jobsListApiRoute(req, res, config));

  /**
   * GET /api/jobs/:id - Get job details
   */
  router.get('/api/jobs/:id', (req: Request, res: Response) => jobDetailApiRoute(req, res, config));

  /**
   * POST /api/jobs/:id/retry - Retry a failed job
   */
  router.post('/api/jobs/:id/retry', (req: Request, res: Response) =>
    jobRetryRoute(req, res, config),
  );

  /**
   * DELETE /api/jobs/:id - Delete a job
   */
  router.delete('/api/jobs/:id', (req: Request, res: Response) => jobDeleteRoute(req, res, config));

  /**
   * GET /api/logs - Query notification logs
   */
  router.get('/api/logs', (req: Request, res: Response) => logsListApiRoute(req, res, config));

  /**
   * GET /api/logs/:id - Get log details
   */
  router.get('/api/logs/:id', (req: Request, res: Response) => logDetailApiRoute(req, res, config));

  /**
   * GET /api/health - Health check
   */
  router.get('/api/health', (req: Request, res: Response) => healthRoute(req, res));

  return router;
}
