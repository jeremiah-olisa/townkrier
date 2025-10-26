import type { Request, Response } from 'express';
import type { DashboardApiConfig } from '../../types';

/**
 * GET /api/stats - Get overall statistics
 */
export async function statsRoute(
  req: Request,
  res: Response,
  config: DashboardApiConfig,
): Promise<void> {
  try {
    const queueStats = await config.queueManager.getStats();
    const storageStats = await config.storageManager.getStats();

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
}
