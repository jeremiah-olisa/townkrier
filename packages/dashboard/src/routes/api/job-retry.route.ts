import type { Request, Response } from 'express';
import type { DashboardApiConfig } from '../../types';

/**
 * POST /api/jobs/:id/retry - Retry a failed job
 */
export async function jobRetryRoute(
  req: Request,
  res: Response,
  config: DashboardApiConfig,
): Promise<void> {
  try {
    const { id } = req.params;
    await config.queueManager.retryJob(id);

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
}
