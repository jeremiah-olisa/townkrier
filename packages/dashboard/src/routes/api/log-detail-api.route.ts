import type { Request, Response } from 'express';
import type { DashboardApiConfig } from '../../types';

/**
 * GET /api/logs/:id - Get log details
 */
export async function logDetailApiRoute(
  req: Request,
  res: Response,
  config: DashboardApiConfig,
): Promise<void> {
  try {
    const { id } = req.params;
    const log = await config.storageManager.getLog(id);

    if (!log) {
      res.status(404).json({
        error: 'Log not found',
        logId: id,
      });
      return;
    }

    res.json(log);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch log',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
