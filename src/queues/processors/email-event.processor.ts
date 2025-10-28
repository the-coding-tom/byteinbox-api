import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { EmailStatus } from '@prisma/client';
import { PROCESS_EMAIL_EVENT_QUEUE } from '../../common/constants/queues.constant';
import { EmailRecipientRepository } from '../../repositories/email-recipient.repository';

@Processor(PROCESS_EMAIL_EVENT_QUEUE)
export class EmailEventQueueProcessor {
  private readonly logger = new Logger(EmailEventQueueProcessor.name);

  constructor(private readonly emailRecipientRepository: EmailRecipientRepository) {}

  @Process('email-delivered')
  async handleEmailDelivered(job: Job<any>) {
    const { messageId, timestamp, recipients, metadata } = job.data;

    try {
      this.logger.log(`Processing email delivered event for message ID: ${messageId}`);

      // AWS SES sends separate events for each recipient
      if (!recipients || recipients.length === 0) {
        this.logger.warn(`No recipients in delivered event for message ID: ${messageId}`);
        return;
      }

      // With new architecture, messageId is unique per recipient
      // So we can look up by messageId directly
      const emailRecipient = await this.emailRecipientRepository.findByMessageId(messageId);

      if (!emailRecipient) {
        this.logger.warn(`EmailRecipient not found for messageId: ${messageId}`);
        return;
      }

      // Update recipient status to delivered
      await this.emailRecipientRepository.updateStatus(
        messageId,
        emailRecipient.recipient,
        EmailStatus.delivered,
        { deliveredAt: timestamp ? new Date(timestamp) : new Date() },
      );

      // Create email event for this recipient
      await this.emailRecipientRepository.createEmailEvent(emailRecipient.id, {
        type: 'delivered',
        metadata,
      });

      this.logger.log(`EmailRecipient ${emailRecipient.id} (${emailRecipient.recipient}) marked as delivered`);
    } catch (error) {
      this.logger.error(`Failed to process delivered event: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Process('email-opened')
  async handleEmailOpened(job: Job<any>) {
    const { messageId, userAgent, ipAddress, location, metadata } = job.data;

    try {
      this.logger.log(`Processing email opened event for message ID: ${messageId}`);

      // With new architecture, messageId is unique per recipient
      const emailRecipient = await this.emailRecipientRepository.findByMessageId(messageId);

      if (!emailRecipient) {
        this.logger.warn(`EmailRecipient not found for messageId: ${messageId}`);
        return;
      }

      // Increment opens count (set openedAt if this is the first open)
      const openedAtTimestamp = emailRecipient.openedAt ? undefined : new Date();
      await this.emailRecipientRepository.incrementOpens(emailRecipient.id, openedAtTimestamp);

      // Create email event for this recipient
      await this.emailRecipientRepository.createEmailEvent(emailRecipient.id, {
        type: 'opened',
        userAgent,
        ipAddress,
        location,
        metadata,
      });

      this.logger.log(`EmailRecipient ${emailRecipient.id} (${emailRecipient.recipient}) opened (total opens: ${emailRecipient.opens + 1})`);
    } catch (error) {
      this.logger.error(`Failed to process opened event: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Process('email-clicked')
  async handleEmailClicked(job: Job<any>) {
    const { messageId, userAgent, ipAddress, location, metadata } = job.data;

    try {
      this.logger.log(`Processing email clicked event for message ID: ${messageId}`);

      // With new architecture, messageId is unique per recipient
      const emailRecipient = await this.emailRecipientRepository.findByMessageId(messageId);

      if (!emailRecipient) {
        this.logger.warn(`EmailRecipient not found for messageId: ${messageId}`);
        return;
      }

      // Increment clicks count
      await this.emailRecipientRepository.incrementClicks(emailRecipient.id);

      // Create email event for this recipient
      await this.emailRecipientRepository.createEmailEvent(emailRecipient.id, {
        type: 'clicked',
        userAgent,
        ipAddress,
        location,
        metadata,
      });

      this.logger.log(`EmailRecipient ${emailRecipient.id} (${emailRecipient.recipient}) clicked (total clicks: ${emailRecipient.clicks + 1})`);
    } catch (error) {
      this.logger.error(`Failed to process clicked event: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Process('email-bounced')
  async handleEmailBounced(job: Job<any>) {
    const { messageId, bounceType, bounceSubType, metadata } = job.data;

    try {
      this.logger.log(`Processing email bounced event for message ID: ${messageId}`);

      // With new architecture, messageId is unique per recipient
      const emailRecipient = await this.emailRecipientRepository.findByMessageId(messageId);

      if (!emailRecipient) {
        this.logger.warn(`EmailRecipient not found for messageId: ${messageId}`);
        return;
      }

      // Update recipient status to bounced
      await this.emailRecipientRepository.updateStatus(
        messageId,
        emailRecipient.recipient,
        EmailStatus.bounced,
      );

      // Create email event for this recipient
      await this.emailRecipientRepository.createEmailEvent(emailRecipient.id, {
        type: 'bounced',
        bounceType,
        bounceSubType,
        metadata,
      });

      this.logger.log(`EmailRecipient ${emailRecipient.id} (${emailRecipient.recipient}) bounced (type: ${bounceType}, subtype: ${bounceSubType})`);
    } catch (error) {
      this.logger.error(`Failed to process bounced event: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Process('email-complained')
  async handleEmailComplained(job: Job<any>) {
    const { messageId, complaintFeedbackType, metadata } = job.data;

    try {
      this.logger.log(`Processing email complaint event for message ID: ${messageId}`);

      // With new architecture, messageId is unique per recipient
      const emailRecipient = await this.emailRecipientRepository.findByMessageId(messageId);

      if (!emailRecipient) {
        this.logger.warn(`EmailRecipient not found for messageId: ${messageId}`);
        return;
      }

      // Create email event for this recipient
      await this.emailRecipientRepository.createEmailEvent(emailRecipient.id, {
        type: 'complained',
        complaintFeedbackType,
        metadata,
      });

      this.logger.log(`EmailRecipient ${emailRecipient.id} (${emailRecipient.recipient}) received complaint (feedback type: ${complaintFeedbackType})`);
    } catch (error) {
      this.logger.error(`Failed to process complaint event: ${error.message}`, error.stack);
      throw error;
    }
  }
}
