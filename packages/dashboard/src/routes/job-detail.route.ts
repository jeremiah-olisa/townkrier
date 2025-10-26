import type { Request, Response } from 'express';
import type { DashboardLogger, DashboardConfig } from '../types';

/**
 * Job detail page route handler
 */
export async function jobDetailRoute(
  req: Request,
  res: Response,
  config: DashboardConfig,
  logger: DashboardLogger,
  basePath: string,
): Promise<void> {
  try {
    const jobId = req.params.id;
    logger.log(`Loading job detail: ${jobId}`);

    const job = await config.queueManager.getJob(jobId);

    if (!job) {
      logger.warn(`Job not found: ${jobId}`);
      res.status(404).send('Job not found');
      return;
    }

    logger.log(`Job found: ${jobId}, status: ${job.status}`);

    res.render('pages/job-detail', {
      title: 'Job Details',
      page: 'jobs',
      basePath,
      job,
    });
  } catch (error) {
    logger.error(`Error loading job ${req.params.id}:`, error);
    res.status(500).send('Error loading job');
  }
}
