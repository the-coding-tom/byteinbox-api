import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

import { PROCESS_NOTIFICATION_QUEUE } from '../../common/constants/queues.constant';
import { logInfoMessage, logError } from '../../utils/logger';

@Processor(PROCESS_NOTIFICATION_QUEUE)
export class NotificationQueueProcessor {
  private readonly logger = new Logger(NotificationQueueProcessor.name);

  constructor() {
    this.logger.log('NotificationQueueProcessor initialized and ready to process jobs');
  }

  @Process('user-created')
  async handleUserCreated(job: Job<any>) {
    try {
      this.logger.log('Processing user-created notification');
      logInfoMessage('NotificationQueueProcessor: Processing user-created notification', {
        jobId: job.id,
        jobData: job.data,
        timestamp: new Date().toISOString(),
      });

      const { userId, email } = job.data;

      // Simulate sending welcome email
      this.logger.log(`Sending welcome email to: ${email}`);
      logInfoMessage(`NotificationQueueProcessor: Sending welcome email to ${email}`, {
        userId,
        email,
        jobId: job.id,
      });

      // Here you would integrate with your notification service
      // await this.emailService.sendWelcomeEmail(email);

      this.logger.log(`User-created notification completed for user: ${userId}`);
      logInfoMessage(
        `NotificationQueueProcessor: User-created notification completed for user ${userId}`,
        {
          userId,
          email,
          jobId: job.id,
          duration: Date.now() - job.timestamp,
        },
      );
    } catch (error) {
      this.logger.error(`Failed to process user-created notification: ${error}`);
      logError('NotificationQueueProcessor: Failed to process user-created notification', error, {
        jobId: job.id,
        jobData: job.data,
      });
      throw error; // Let Bull handle retries
    }
  }

  @Process('user-updated')
  async handleUserUpdated(job: Job<any>) {
    try {
      this.logger.log('Processing user-updated notification');
      logInfoMessage('NotificationQueueProcessor: Processing user-updated notification', {
        jobId: job.id,
        jobData: job.data,
        timestamp: new Date().toISOString(),
      });

      const { userId, email } = job.data;

      // Simulate sending update notification
      this.logger.log(`Sending update notification to: ${email}`);
      logInfoMessage(`NotificationQueueProcessor: Sending update notification to ${email}`, {
        userId,
        email,
        jobId: job.id,
      });

      // Here you would integrate with your notification service
      // await this.emailService.sendUpdateNotification(email);

      this.logger.log(`User-updated notification completed for user: ${userId}`);
      logInfoMessage(
        `NotificationQueueProcessor: User-updated notification completed for user ${userId}`,
        {
          userId,
          email,
          jobId: job.id,
          duration: Date.now() - job.timestamp,
        },
      );
    } catch (error) {
      this.logger.error(`Failed to process user-updated notification: ${error}`);
      logError('NotificationQueueProcessor: Failed to process user-updated notification', error, {
        jobId: job.id,
        jobData: job.data,
      });
      throw error;
    }
  }
}
