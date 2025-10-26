import type { Request, Response } from 'express';
import type { DashboardApiConfig } from '../../types';

/**
 * GET /api/jobs/:id - Get job details
 */
export async function jobDetailApiRoute(
  req: Request,
  res: Response,
  config: DashboardApiConfig,
): Promise<void> {
  try {
    const { id } = req.params;
    const job = await config.queueManager.getJob(id);

    if (!job) {
      res.status(404).json({
        error: 'Job not found',
        jobId: id,
      });
      return;
    }

    res.json(job);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch job',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
