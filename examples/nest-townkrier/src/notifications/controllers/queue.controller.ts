import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotificationService } from '../services/notification.service';

@ApiTags('queue')
@Controller('queue')
export class QueueController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get queue statistics' })
  @ApiResponse({ status: 200, description: 'Queue statistics retrieved' })
  async getStats() {
    const queueManager = this.notificationService.getQueueManager();
    return await queueManager.getStats();
  }

  @Get('jobs')
  @ApiOperation({ summary: 'Get all jobs' })
  @ApiResponse({ status: 200, description: 'Jobs retrieved successfully' })
  async getJobs() {
    const queueManager = this.notificationService.getQueueManager();
    return await queueManager.getJobs({ limit: 100 });
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Get job by ID' })
  @ApiResponse({ status: 200, description: 'Job retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getJob(@Param('id') id: string) {
    const queueManager = this.notificationService.getQueueManager();
    const job = await queueManager.getJob(id);

    if (!job) {
      return { error: 'Job not found' };
    }

    return job;
  }

  @Get('jobs/:id/retry')
  @ApiOperation({ summary: 'Retry a failed job' })
  @ApiResponse({ status: 200, description: 'Job retry initiated' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async retryJob(@Param('id') id: string) {
    const queueManager = this.notificationService.getQueueManager();

    try {
      await queueManager.retryJob(id);
      return { success: true, message: 'Job retry initiated' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
