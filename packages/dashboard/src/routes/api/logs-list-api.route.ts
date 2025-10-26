import type { Request, Response } from 'express';
import type { DashboardApiConfig } from '../../types';
import type { NotificationChannel } from '@townkrier/core';
import type { NotificationLogStatus } from '@townkrier/storage';

/**
 * GET /api/logs - Query notification logs
 */
export async function logsListApiRoute(
  req: Request,
  res: Response,
  config: DashboardApiConfig,
): Promise<void> {
  try {
    const {
      notificationId,
      channel,
      status,
      recipient,
      startDate,
      endDate,
      limit = '50',
      offset = '0',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const result = await config.storageManager.queryLogs({
      notificationId: notificationId as string,
      channel: channel as NotificationChannel,
      status: status as NotificationLogStatus | undefined,
      recipient: recipient as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      sortBy: sortBy as 'createdAt' | 'sentAt' | 'deliveredAt' | undefined,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
    });

    res.json({
      logs: result.logs,
      total: result.total,
      page: {
        offset: parseInt(offset as string),
        limit: parseInt(limit as string),
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to query logs',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
