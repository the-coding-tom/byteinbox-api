import { Process, Processor } from '@nestjs/bull';
import { InjectQueue } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bull';
import {
  EMAIL_ROUTER_QUEUE,
  EMAIL_TEMPLATE_QUEUE,
  EMAIL_ATTACHMENT_QUEUE,
} from '../../common/constants/queues.constant';
import { EmailRepository } from '../../repositories/email.repository';
import { EmailEnqueuerService } from '../../shared-services/email-enqueuer/email-enqueuer.service';
import { config } from '../../config/config';

/**
 * Email Router Processor
 *
 * Responsibilities:
 * - Routes incoming emails to the appropriate processing queue
 * - Decides path based on email type and requirements
 *
 * Routing Logic:
 * 1. Has template? → EMAIL_TEMPLATE_QUEUE
 * 2. Has attachment URLs (path field)? → EMAIL_ATTACHMENT_QUEUE
 * 3. Simple email (no template, no attachment URLs)? → EmailEnqueuerService (per-recipient jobs)
 */
@Processor(EMAIL_ROUTER_QUEUE)
export class EmailRouterQueueProcessor {
  private readonly logger = new Logger(EmailRouterQueueProcessor.name);

  constructor(
    private readonly emailRepository: EmailRepository,
    private readonly emailEnqueuer: EmailEnqueuerService,
    @InjectQueue(EMAIL_TEMPLATE_QUEUE) private readonly templateQueue: Queue,
    @InjectQueue(EMAIL_ATTACHMENT_QUEUE) private readonly attachmentQueue: Queue,
  ) {}

  @Process('route-email')
  async handleRouteEmail(job: Job<{ emailId: number }>) {
    const { emailId } = job.data;

    try {
      this.logger.log(`Routing email ${emailId}`);

      // Fetch email with attachments
      const email = await this.emailRepository.findById(emailId);
      if (!email) {
        this.logger.error(`Email not found: ${emailId}`);
        return;
      }

      // Route based on email properties
      await this.routeEmail(email, emailId);

    } catch (error) {
      this.logger.error(`Failed to route email ${emailId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Routes email to appropriate destination based on its properties
   */
  private async routeEmail(email: any, emailId: number): Promise<void> {
    // Priority 1: Template rendering required
    if (email.templateId) {
      this.logger.log(`Email ${emailId} has template, routing to TEMPLATE queue`);
      await this.templateQueue.add(
        'render-template',
        { emailId },
        {
          attempts: config.queue.jobRetryAttempts,
          backoff: {
            type: 'exponential',
            delay: config.queue.jobRetryDelayMs,
          },
        }
      );
      return;
    }

    // Priority 2: Attachment download required (has attachments with path field)
    const hasAttachmentUrls = email.attachments?.some((att: any) => att.path);
    if (hasAttachmentUrls) {
      this.logger.log(`Email ${emailId} has attachment URLs, routing to ATTACHMENT queue`);
      await this.attachmentQueue.add(
        'download-attachments',
        { emailId },
        {
          attempts: config.queue.jobRetryAttempts,
          backoff: {
            type: 'exponential',
            delay: config.queue.jobRetryDelayMs,
          },
        }
      );
      return;
    }

    // Priority 3: Simple email - enqueue per-recipient send jobs
    this.logger.log(`Email ${emailId} is simple, enqueueing per-recipient jobs`);
    await this.emailEnqueuer.enqueuePerRecipient(emailId);
  }
}
