import type { Request, Response } from 'express';
import type { DashboardApiConfig } from '../../types';

/**
 * DELETE /api/jobs/:id - Delete a job
 */
export async function jobDeleteRoute(
  req: Request,
  res: Response,
  config: DashboardApiConfig,
): Promise<void> {
  try {
    const { id } = req.params;
    await config.queueManager.deleteJob(id);

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
}
