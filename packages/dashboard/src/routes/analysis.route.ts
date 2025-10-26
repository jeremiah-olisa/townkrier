import type { Request, Response } from 'express';
import type { DashboardConfig, DashboardLogger, GetStatsFunction } from '../types';

/**
 * Analysis page route handler
 */
export async function analysisRoute(
  req: Request,
  res: Response,
  config: DashboardConfig,
  logger: DashboardLogger,
  basePath: string,
  getStats: GetStatsFunction,
): Promise<void> {
  try {
    logger.log('Loading analysis page');

    const stats = await getStats(config);

    logger.log('Analysis stats loaded successfully');

    res.render('pages/analysis', {
      title: 'Delivery Analysis',
      page: 'analysis',
      basePath,
      stats,
    });
  } catch (error) {
    logger.error('Error loading analysis page:', error);
    res.status(500).send('Error loading analysis');
  }
}
