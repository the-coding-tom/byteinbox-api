import { Process, Processor } from '@nestjs/bull';
import { InjectQueue } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bull';
import {
  EMAIL_TEMPLATE_QUEUE,
  EMAIL_ATTACHMENT_QUEUE,
} from '../../common/constants/queues.constant';
import { EmailRepository } from '../../repositories/email.repository';
import { TemplateRepository } from '../../repositories/template.repository';
import { TemplateVersionRepository } from '../../repositories/template-version.repository';
import { EmailEnqueuerService } from '../../shared-services/email-enqueuer/email-enqueuer.service';
import { TemplateUtil } from '../../utils/template.util';
import { config } from '../../config/config';

/**
 * Email Template Processor
 *
 * Responsibilities:
 * - Fetches template from database
 * - Renders template with provided variables
 * - Generates complete HTML, subject, and text
 * - Routes to next queue (attachment download or direct send)
 *
 * Flow:
 * 1. Fetch template from DB
 * 2. Render with variables (subject + html + text)
 * 3. Update email record with rendered content
 * 4. Route to EMAIL_ATTACHMENT (if has URLs) OR SEND_EMAIL (if ready)
 */
@Processor(EMAIL_TEMPLATE_QUEUE)
export class EmailTemplateQueueProcessor {
  private readonly logger = new Logger(EmailTemplateQueueProcessor.name);

  constructor(
    private readonly emailRepository: EmailRepository,
    private readonly templateRepository: TemplateRepository,
    private readonly templateVersionRepository: TemplateVersionRepository,
    private readonly emailEnqueuer: EmailEnqueuerService,
    @InjectQueue(EMAIL_ATTACHMENT_QUEUE) private readonly attachmentQueue: Queue,
  ) {}

  @Process('render-template')
  async handleRenderTemplate(job: Job<{ emailId: number }>) {
    const { emailId } = job.data;

    try {
      this.logger.log(`Rendering template for email ${emailId}`);

      // Fetch email with template data
      const email = await this.emailRepository.findById(emailId);
      if (!email) {
        this.logger.error(`Email not found: ${emailId}`);
        return;
      }

      // Validate template requirement
      if (!email.templateId) {
        throw new Error(`Email ${emailId} missing template ID`);
      }

      // Fetch template with current version and variables
      const template = await this.templateRepository.findById(
        email.templateId,
        email.teamId
      );

      if (!template) {
        throw new Error(
          `Template ${email.templateId} not found for team ${email.teamId}`
        );
      }

      if (!template.CurrentVersion) {
        throw new Error(
          `Template ${email.templateId} has no published version`
        );
      }

      // Get fallback variables from repository
      const fallbackData = await this.templateVersionRepository.getFallbackVariables(
        template.CurrentVersion.id
      );

      // Merge: fallback values first, then override with provided variables
      const templateData = {
        ...fallbackData,
        ...email.templateData,
      };

      // Render template with variables
      const rendered = TemplateUtil.renderWithSubject(
        template.CurrentVersion.html,
        template.CurrentVersion.subject || email.subject,
        templateData
      );

      this.logger.log(`Template rendered successfully for email ${emailId}`);

      // Update email with rendered content
      await this.emailRepository.update(emailId, {
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      });

      // Determine next destination by checking if there are attachments with path URLs
      const attachmentWithPathUrlCount = await this.emailRepository.countAttachmentsWithPathUrl(emailId);

      if (attachmentWithPathUrlCount > 0) {
        // Route to attachment processor
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
      } else {
        // Enqueue per-recipient send jobs
        this.logger.log(`Email ${emailId} ready to send, enqueueing per-recipient jobs`);

        await this.emailEnqueuer.enqueuePerRecipient(emailId);
      }

    } catch (error) {
      this.logger.error(
        `Failed to render template for email ${emailId}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}
