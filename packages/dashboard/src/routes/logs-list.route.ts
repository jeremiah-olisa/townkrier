import type { NotificationChannel } from '@townkrier/core';
import type { NotificationLogStatus } from '@townkrier/storage';
import type { Request, Response } from 'express';
import type { DashboardLogger, DashboardConfig } from '../types';

/**
 * Logs list page route handler
 */
export async function logsListRoute(
  req: Request,
  res: Response,
  config: DashboardConfig,
  logger: DashboardLogger,
  basePath: string,
): Promise<void> {
  try {
    const channel = req.query.channel as string | undefined;
    const status = req.query.status as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    logger.log(
      `Loading logs list - channel: ${channel || 'all'}, status: ${status || 'all'}, limit: ${limit}, offset: ${offset}`,
    );

    const result = await config.storageManager.queryLogs({
      channel: channel as NotificationChannel | undefined,
      status: status as NotificationLogStatus | undefined,
      limit,
      offset,
    });

    logger.log(`Loaded ${result.logs.length} logs (total: ${result.total})`);

    res.render('pages/logs', {
      title: 'Notification Logs',
      page: 'logs',
      basePath,
      logs: result.logs,
      channel,
      status,
      limit,
      offset,
    });
  } catch (error) {
    logger.error('Error loading logs list:', error);
    res.status(500).send('Error loading logs');
  }
}
