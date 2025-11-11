import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import axios from 'axios';
import * as mime from 'mime-types';
import { EMAIL_ATTACHMENT_QUEUE } from '../../common/constants/queues.constant';
import { EmailRepository } from '../../repositories/email.repository';
import { EmailEnqueuerService } from '../../shared-services/email-enqueuer/email-enqueuer.service';

/**
 * Email Attachment Processor
 *
 * Responsibilities:
 * - Downloads attachments from provided URLs (path field)
 * - Converts downloaded files to base64
 * - Updates attachment records with downloaded content
 * - Routes to send queue once all downloads complete
 *
 * Flow:
 * 1. Fetch email with attachments
 * 2. Download each attachment from URL (if path exists)
 * 3. Convert to base64 and update DB
 * 4. Route to SEND_EMAIL queue
 */
@Processor(EMAIL_ATTACHMENT_QUEUE)
export class EmailAttachmentQueueProcessor {
  private readonly logger = new Logger(EmailAttachmentQueueProcessor.name);

  constructor(
    private readonly emailRepository: EmailRepository,
    private readonly emailEnqueuer: EmailEnqueuerService,
  ) { }

  @Process('download-attachments')
  async handleDownloadAttachments(job: Job<{ emailId: number }>) {
    const { emailId } = job.data;

    try {
      this.logger.log(`Downloading attachments for email ${emailId}`);

      // Fetch attachments that need downloading (database-level filtering)
      const attachmentsToDownload = await this.emailRepository.findAttachmentsToDownload(emailId);

      // If no attachments to download, enqueue per-recipient send jobs
      if (attachmentsToDownload.length === 0) {
        this.logger.log(`No attachments to download for email ${emailId}, enqueueing per-recipient jobs`);

        await this.emailEnqueuer.enqueuePerRecipient(emailId);

        return;
      }

      // If there are attachments to download, download them.
      await Promise.all(
        attachmentsToDownload.map(async (attachment: any) => {
          // Download file from URL
          const response = await axios.get(attachment.path, {
            responseType: 'arraybuffer',
            timeout: 30000, // 30 second timeout
          });

          // Convert to base64
          const base64Content = Buffer.from(response.data).toString('base64');

          // Detect content type if not provided
          const contentType =
            attachment.contentType ||
            response.headers['content-type'] ||
            mime.lookup(attachment.filename) ||
            'application/octet-stream';

          // Update attachment record with downloaded content
          await this.emailRepository.updateAttachment(attachment.id, {
            content: base64Content,
            contentType,
          });

          this.logger.log(
            `Downloaded attachment ${attachment.filename} (${(base64Content.length / 1024).toFixed(2)} KB)`
          );
        })
      );

      // Enqueue per-recipient send jobs
      this.logger.log(`All attachments downloaded for email ${emailId}, enqueueing per-recipient jobs`);

      await this.emailEnqueuer.enqueuePerRecipient(emailId);

    } catch (error) {
      this.logger.error(
        `Failed to download attachments for email ${emailId}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}
