import type { Request, Response } from 'express';
import type { DashboardLogger, DashboardConfig } from '../types';

/**
 * Log detail page route handler
 */
export async function logDetailRoute(
  req: Request,
  res: Response,
  config: DashboardConfig,
  logger: DashboardLogger,
  basePath: string,
): Promise<void> {
  try {
    const logId = req.params.id;
    logger.log(`Loading log detail: ${logId}`);

    const log = await config.storageManager.getLog(logId);

    if (!log) {
      logger.warn(`Log not found: ${logId}`);
      res.status(404).send('Log not found');
      return;
    }

    logger.log(`Log found: ${logId}, status: ${log.status}, channel: ${log.channel}`);

    res.render('pages/log-detail', {
      title: 'Notification Details',
      page: 'logs',
      basePath,
      log,
    });
  } catch (error) {
    logger.error(`Error loading log ${req.params.id}:`, error);
    res.status(500).send('Error loading log');
  }
}
