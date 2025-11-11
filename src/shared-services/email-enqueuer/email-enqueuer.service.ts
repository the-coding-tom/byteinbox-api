import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { SEND_EMAIL_QUEUE } from '../../common/constants/queues.constant';
import { EmailRecipientRepository } from '../../repositories/email-recipient.repository';
import { config } from '../../config/config';

/**
 * Email Enqueuer Service
 *
 * Responsible for enqueueing per-recipient email sending jobs.
 * This service ensures that each recipient gets their own individual job,
 * enabling per-recipient tracking, retries, and webhook events.
 */
@Injectable()
export class EmailEnqueuerService {
  private readonly logger = new Logger(EmailEnqueuerService.name);

  constructor(
    private readonly emailRecipientRepository: EmailRecipientRepository,
    @InjectQueue(SEND_EMAIL_QUEUE) private readonly sendEmailQueue: Queue,
  ) {}

  /**
   * Enqueue one send job per recipient for an email
   * @param emailId - The email ID
   */
  async enqueuePerRecipient(emailId: number): Promise<void> {
    try {
      // Fetch all recipients for this email
      const recipients = await this.emailRecipientRepository.findByEmailId(emailId);

      if (recipients.length === 0) {
        this.logger.warn(`No recipients found for email ${emailId}`);
        return;
      }

      this.logger.log(`Enqueueing ${recipients.length} send jobs for email ${emailId}`);

      // Enqueue one job per recipient
      const enqueuePromises = recipients.map(async (recipient) => {
        return this.sendEmailQueue.add(
          'send-email',
          {
            emailId,
            recipientId: recipient.id,
          },
          {
            attempts: config.queue.jobRetryAttempts,
            backoff: {
              type: 'exponential',
              delay: config.queue.jobRetryDelayMs,
            },
          },
        );
      });

      await Promise.all(enqueuePromises);

      this.logger.log(`Successfully enqueued ${recipients.length} send jobs for email ${emailId}`);
    } catch (error) {
      this.logger.error(
        `Failed to enqueue send jobs for email ${emailId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
