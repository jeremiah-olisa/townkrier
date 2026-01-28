import type { JobStatus } from 'townkrier-queue';
import type { Request, Response } from 'express';
import type { DashboardLogger, DashboardConfig } from '../types';

/**
 * Jobs list page route handler
 */
export async function jobsListRoute(
  req: Request,
  res: Response,
  config: DashboardConfig,
  logger: DashboardLogger,
  basePath: string,
): Promise<void> {
  try {
    const status = req.query.status as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    logger.log(
      `Loading jobs list - status: ${status || 'all'}, limit: ${limit}, offset: ${offset}`,
    );

    const jobs = await config.queueManager.getJobs({
      status: status as JobStatus | undefined,
      limit,
      offset,
    });

    logger.log(`Loaded ${jobs.length} jobs`);

    res.render('pages/jobs', {
      title: 'Jobs',
      page: 'jobs',
      basePath,
      jobs,
      status,
      limit,
      offset,
    });
  } catch (error) {
    logger.error('Error loading jobs list:', error);
    res.status(500).send('Error loading jobs');
  }
}
