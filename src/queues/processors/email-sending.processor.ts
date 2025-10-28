import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import axios from 'axios';
import * as mime from 'mime-types';
import { SEND_EMAIL_QUEUE } from '../../common/constants/queues.constant';
import { EmailRepository } from '../../repositories/email.repository';
import { EmailRecipientRepository } from '../../repositories/email-recipient.repository';
import { sendEmailToSingleRecipient } from '../../helpers/aws-ses.helper';
import { config } from '../../config/config';

@Processor(SEND_EMAIL_QUEUE)
export class EmailSendingQueueProcessor {
  private readonly logger = new Logger(EmailSendingQueueProcessor.name);

  constructor(
    private readonly emailRepository: EmailRepository,
    private readonly emailRecipientRepository: EmailRecipientRepository,
  ) {}

  @Process('send-email')
  async handleSendEmail(job: Job<any>) {
    const { emailId } = job.data;

    try {
      this.logger.log(`Processing email send job for email ID ${emailId}`);

      // Fetch email with domain, attachments, and recipients
      const email = await this.emailRepository.findById(emailId);
      if (!email) {
        this.logger.error(`Email not found: ${emailId}`);
        return;
      }

      // Check if email has already been sent
      if (email.sentAt) {
        this.logger.warn(`Email ${emailId} has already been sent, skipping`);
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

      // Send INDIVIDUAL emails per recipient with same TO/CC display headers
      // This creates the illusion of one email while enabling per-recipient tracking
      this.logger.log(`Sending ${email.recipients.length} individual emails for email ID ${emailId}`);

      const sendPromises = email.recipients.map(async (recipient: any) => {
        try {
          const result = await sendEmailToSingleRecipient({
            from: email.from,
            actualRecipient: recipient.recipient, // Single actual recipient
            displayTo: email.to, // Show all TO addresses in header
            displayCc: email.cc || [], // Show all CC addresses in header
            replyTo: email.replyTo || [],
            subject: email.subject,
            text: email.text,
            html: email.html,
            region: domain.region,
            configurationSetName: config.aws.ses.configurationSetName,
            tags: {
              emailId: emailId.toString(),
              recipientId: recipient.id.toString(),
              teamId: email.teamId.toString(),
              domainId: email.domainId.toString(),
            },
            attachments,
          });

          // Update this specific recipient with their unique messageId
          await this.emailRecipientRepository.updateMessageIdAndSent(recipient.id, result.messageId);

          this.logger.log(
            `Sent email to ${recipient.recipient} with message ID: ${result.messageId}`
          );

          return result.messageId;
        } catch (error) {
          this.logger.error(
            `Failed to send to recipient ${recipient.recipient}: ${error.message}`,
            error.stack
          );
          throw error; // Re-throw to fail the entire job for retry
        }
      });

      // Wait for all emails to be sent
      await Promise.all(sendPromises);

      // Mark email as sent (all recipients have been processed)
      await this.emailRepository.update(emailId, {
        sentAt: new Date(),
      });

      this.logger.log(`Email ${emailId} sent successfully to all ${email.recipients.length} recipients`);
    } catch (error) {
      this.logger.error(`Failed to send email ${emailId}: ${error.message}`, error.stack);

      // Re-throw error to let Bull handle retries
      // Recipients remain in 'queued' status for retry attempts
      throw error;
    }
  }
}
