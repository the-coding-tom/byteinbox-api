import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import axios from 'axios';
import * as mime from 'mime-types';
import { EmailStatus } from '@prisma/client';
import { SEND_EMAIL_QUEUE } from '../../common/constants/queues.constant';
import { EmailRepository } from '../../repositories/email.repository';
import { sendEmailWithSES } from '../../helpers/aws-ses.helper';
import { config } from '../../config/config';

@Processor(SEND_EMAIL_QUEUE)
export class EmailSendingQueueProcessor {
  private readonly logger = new Logger(EmailSendingQueueProcessor.name);

  constructor(private readonly emailRepository: EmailRepository) {}

  @Process('send-email')
  async handleSendEmail(job: Job<any>) {
    const { emailId } = job.data;

    try {
      this.logger.log(`Processing email send job for email ID ${emailId}`);

      // Fetch email with domain and attachments
      const email = await this.emailRepository.findById(emailId);
      if (!email) {
        this.logger.error(`Email not found: ${emailId}`);
        return;
      }

      // Check if email is still in queued status
      if (email.status !== EmailStatus.queued) {
        this.logger.warn(`Email ${emailId} is not in queued status (${email.status}), skipping`);
        return;
      }

      // Validate domain
      if (!email.Domain) {
        throw new Error(`Domain not found for email ${emailId}`);
      }

      // Prepare email data
      const domain = email.Domain;

      // Process attachments - download from path if needed
      const attachments = await Promise.all(
        (email.attachments || []).map(async (attachment: any) => {
          let content = attachment.content;

          // If path is provided, download from URL
          if (attachment.path) {
            const response = await axios.get(attachment.path, { responseType: 'arraybuffer' });
            content = Buffer.from(response.data).toString('base64');
          }

          return {
            filename: attachment.filename,
            content,
            contentType: attachment.contentType || mime.lookup(attachment.filename),
          };
        })
      );

      // Send email via AWS SES
      this.logger.log(`Sending email ${emailId} via AWS SES in region ${domain.region}`);

      const result = await sendEmailWithSES({
        from: email.from,
        to: email.to,
        cc: email.cc || [],
        bcc: email.bcc || [],
        replyTo: email.replyTo || [],
        subject: email.subject,
        text: email.text,
        html: email.html,
        region: domain.region,
        configurationSetName: config.aws.ses.configurationSetName,
        tags: {
          emailId: emailId.toString(),
          teamId: email.teamId.toString(),
          domainId: email.domainId.toString(),
        },
        attachments,
      });

      // Update email status to sent
      await this.emailRepository.update(emailId, {
        status: EmailStatus.sent,
        messageId: result.messageId,
        sentAt: new Date(),
      });

      this.logger.log(`Email ${emailId} sent successfully with message ID: ${result.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send email ${emailId}: ${error.message}`, error.stack);

      // Update email status to failed
      await this.emailRepository.update(emailId, {
        status: EmailStatus.failed,
      });

      // Re-throw error to let Bull handle retries
      throw error;
    }
  }
}
