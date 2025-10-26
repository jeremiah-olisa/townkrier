import type { Request, Response } from 'express';
import type { DashboardApiConfig } from '../../types';
import type { JobStatus } from '@townkrier/queue';

/**
 * GET /api/jobs - List jobs with filters
 */
export async function jobsListApiRoute(
  req: Request,
  res: Response,
  config: DashboardApiConfig,
): Promise<void> {
  try {
    const { status, limit = '50', offset = '0' } = req.query;

    const jobs = await config.queueManager.getJobs({
      status: status as JobStatus | undefined,
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
}
