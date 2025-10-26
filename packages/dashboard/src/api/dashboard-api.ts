import { Router, Request, Response } from 'express';
import { QueueManager } from '@townkrier/queue';
import { StorageManager } from '@townkrier/storage';
import { NotificationChannel } from '@townkrier/core';

/**
 * Dashboard API Router configuration
 */
export interface DashboardApiConfig {
  queueManager: QueueManager;
  storageManager: StorageManager;
}

/**
 * Create Express router for dashboard API
 */
export function createDashboardRouter(config: DashboardApiConfig): Router {
  const router = Router();
  const { queueManager, storageManager } = config;

  // Middleware for JSON responses
  router.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
  });

  /**
   * GET /api/stats - Get overall statistics
   */
  router.get('/api/stats', async (req: Request, res: Response) => {
    try {
      const queueStats = await queueManager.getStats();
      const storageStats = await storageManager.getStats();

      res.json({
        queue: queueStats,
        notifications: storageStats,
        timestamp: new Date(),
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch statistics',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/jobs - List jobs with filters
   */
  router.get('/api/jobs', async (req: Request, res: Response) => {
    try {
      const { status, limit = '50', offset = '0' } = req.query;

      const jobs = await queueManager.getJobs({
        status: status as any,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });

      res.json({
        jobs,
        count: jobs.length,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch jobs',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/jobs/:id - Get job details
   */
  router.get('/api/jobs/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const job = await queueManager.getJob(id);

      if (!job) {
        return res.status(404).json({
          error: 'Job not found',
          jobId: id,
        });
      }

      res.json(job);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch job',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * POST /api/jobs/:id/retry - Retry a failed job
   */
  router.post('/api/jobs/:id/retry', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await queueManager.retryJob(id);

      res.json({
        success: true,
        message: 'Job queued for retry',
        jobId: id,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to retry job',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * DELETE /api/jobs/:id - Delete a job
   */
  router.delete('/api/jobs/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await queueManager.deleteJob(id);

      res.json({
        success: true,
        message: 'Job deleted',
        jobId: id,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to delete job',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/logs - Query notification logs
   */
  router.get('/api/logs', async (req: Request, res: Response) => {
    try {
      const {
        notificationId,
        channel,
        status,
        recipient,
        startDate,
        endDate,
        limit = '50',
        offset = '0',
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const result = await storageManager.queryLogs({
        notificationId: notificationId as string,
        channel: channel as NotificationChannel,
        status: status as any,
        recipient: recipient as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
      });

      res.json({
        logs: result.logs,
        total: result.total,
        page: {
          offset: parseInt(offset as string),
          limit: parseInt(limit as string),
        },
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to query logs',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/logs/:id - Get log details
   */
  router.get('/api/logs/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const log = await storageManager.getLog(id);

      if (!log) {
        return res.status(404).json({
          error: 'Log not found',
          logId: id,
        });
      }

      res.json(log);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch log',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/health - Health check
   */
  router.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date(),
      version: '1.0.0-alpha.1',
    });
  });

  return router;
}
