import type { Request, Response } from 'express';
import type { DashboardConfig, DashboardLogger, GetStatsFunction } from '../types';

/**
 * Home page route handler
 */
export async function homeRoute(
  req: Request,
  res: Response,
  config: DashboardConfig,
  logger: DashboardLogger,
  basePath: string,
  getStats: GetStatsFunction,
): Promise<void> {
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
}
