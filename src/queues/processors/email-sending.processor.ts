import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { SEND_EMAIL_QUEUE } from '../../common/constants/queues.constant';
import { EmailRepository } from '../../repositories/email.repository';
import { EmailRecipientRepository } from '../../repositories/email-recipient.repository';
import { WebhookPublisherService } from '../../shared-services/webhook-publisher/webhook-publisher.service';
import { sendEmailToSingleRecipient } from '../../helpers/aws-ses.helper';
import { config } from '../../config/config';

/**
 * Email Sending Processor
 *
 * Responsibilities:
 * - Sends email to a SINGLE recipient via AWS SES
 * - Updates that recipient's status and messageId in database
 * - Publishes per-recipient webhook event
 *
 * Note:
 * - Each job processes ONE recipient (not multiple)
 * - Template rendering and attachment downloading handled upstream
 * - Display headers (TO/CC) show all recipients for email continuity
 */
@Processor(SEND_EMAIL_QUEUE)
export class EmailSendingQueueProcessor {
  private readonly logger = new Logger(EmailSendingQueueProcessor.name);

  constructor(
    private readonly emailRepository: EmailRepository,
    private readonly emailRecipientRepository: EmailRecipientRepository,
    private readonly webhookPublisher: WebhookPublisherService,
  ) {}

  @Process('send-email')
  async handleSendEmail(job: Job<{ emailId: number; recipientId: number }>) {
    const { emailId, recipientId } = job.data;

    try {
      this.logger.log(`Processing send job for email ${emailId}, recipient ${recipientId}`);

      // Fetch email with domain and attachments
      const email = await this.emailRepository.findById(emailId);
      if (!email) {
        this.logger.error(`Email not found: ${emailId}`);
        return;
      }

      // Validate domain
      if (!email.Domain) {
        throw new Error(`Domain not found for email ${emailId}`);
      }

      // Fetch the specific recipient
      const recipient = await this.emailRecipientRepository.findById(recipientId);
      if (!recipient) {
        this.logger.error(`Recipient ${recipientId} not found`);
        return;
      }

      // Check if already sent
      if (recipient.sentAt) {
        this.logger.warn(`Recipient ${recipientId} already sent, skipping`);
        return;
      }

      // Fetch attachments for sending (only necessary fields)
      const attachments = await this.emailRepository.findAttachmentsForSending(emailId);

      // Send email to this ONE recipient with display headers showing all TO/CC
      // This creates the illusion of one email while enabling per-recipient tracking
      this.logger.log(`Sending email to ${recipient.recipient} for email ${emailId}`);

      const result = await sendEmailToSingleRecipient({
        from: email.from,
        actualRecipient: recipient.recipient, // Single actual recipient
        displayTo: email.to, // Show all TO addresses in header
        displayCc: email.cc || [], // Show all CC addresses in header
        replyTo: email.replyTo || [],
        subject: email.subject,
        text: email.text,
        html: email.html,
        region: email.Domain.region,
        configurationSetName: config.aws.ses.configurationSetName,
        tags: {
          emailId: emailId.toString(),
          recipientId: recipientId.toString(),
          teamId: email.teamId.toString(),
          domainId: email.domainId.toString(),
        },
        attachments,
      });

      // Update this recipient with their unique messageId and mark as sent
      await this.emailRecipientRepository.updateMessageIdAndSent(recipientId, result.messageId);

      this.logger.log(
        `Successfully sent email to ${recipient.recipient} with message ID: ${result.messageId}`
      );

      // Publish per-recipient webhook event
      await this.webhookPublisher.publishEvent(
        email.teamId,
        'email.sent',
        {
          id: email.reference,
          recipient: recipient.recipient,
          from: email.from,
          to: email.to,
          cc: email.cc,
          bcc: email.bcc,
          subject: email.subject,
          messageId: result.messageId,
          sentAt: new Date().toISOString(),
        },
        result.messageId,
      );

    } catch (error) {
      this.logger.error(
        `Failed to send email to recipient ${recipientId} for email ${emailId}: ${error.message}`,
        error.stack
      );

      // Re-throw error to let Bull handle retries
      // Recipient remains in 'queued' status for retry attempts
      throw error;
    }
  }
}
