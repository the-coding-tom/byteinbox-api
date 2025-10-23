import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { EmailStatus } from '@prisma/client';
import { PROCESS_EMAIL_EVENT_QUEUE } from '../../common/constants/queues.constant';
import { EmailRepository } from '../../repositories/email.repository';

@Processor(PROCESS_EMAIL_EVENT_QUEUE)
export class EmailEventQueueProcessor {
  private readonly logger = new Logger(EmailEventQueueProcessor.name);

  constructor(private readonly emailRepository: EmailRepository) {}

  @Process('email-delivered')
  async handleEmailDelivered(job: Job<any>) {
    const { messageId, timestamp, metadata } = job.data;

    try {
      this.logger.log(`Processing email delivered event for message ID: ${messageId}`);

      const email = await this.emailRepository.findByMessageId(messageId);

      if (!email) {
        this.logger.warn(`Email not found for message ID: ${messageId}`);
        return;
      }

      // Update email status to delivered
      await this.emailRepository.updateByMessageId(messageId, {
        status: EmailStatus.delivered,
        deliveredAt: timestamp ? new Date(timestamp) : new Date(),
      });

      // Create email event
      await this.emailRepository.createEmailEvent({
        emailId: email.id,
        eventType: 'delivered',
        metadata,
      });

      this.logger.log(`Email ${email.id} marked as delivered`);
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

      const email = await this.emailRepository.findByMessageId(messageId);

      if (!email) {
        this.logger.warn(`Email not found for message ID: ${messageId}`);
        return;
      }

      // Increment opens count
      await this.emailRepository.incrementOpens(email.id);

      // Create email event
      await this.emailRepository.createEmailEvent({
        emailId: email.id,
        eventType: 'opened',
        userAgent,
        ipAddress,
        location,
        metadata,
      });

      this.logger.log(`Email ${email.id} opened (total opens: ${email.opens + 1})`);
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

      const email = await this.emailRepository.findByMessageId(messageId);

      if (!email) {
        this.logger.warn(`Email not found for message ID: ${messageId}`);
        return;
      }

      // Increment clicks count
      await this.emailRepository.incrementClicks(email.id);

      // Create email event
      await this.emailRepository.createEmailEvent({
        emailId: email.id,
        eventType: 'clicked',
        userAgent,
        ipAddress,
        location,
        metadata,
      });

      this.logger.log(`Email ${email.id} clicked (total clicks: ${email.clicks + 1})`);
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

      const email = await this.emailRepository.findByMessageId(messageId);

      if (!email) {
        this.logger.warn(`Email not found for message ID: ${messageId}`);
        return;
      }

      // Update email status to bounced
      await this.emailRepository.updateByMessageId(messageId, {
        status: EmailStatus.bounced,
      });

      // Create email event
      await this.emailRepository.createEmailEvent({
        emailId: email.id,
        eventType: 'bounced',
        bounceType,
        bounceSubType,
        metadata,
      });

      this.logger.log(`Email ${email.id} bounced (type: ${bounceType}, subtype: ${bounceSubType})`);
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

      const email = await this.emailRepository.findByMessageId(messageId);

      if (!email) {
        this.logger.warn(`Email not found for message ID: ${messageId}`);
        return;
      }

      // Create email event
      await this.emailRepository.createEmailEvent({
        emailId: email.id,
        eventType: 'complained',
        complaintFeedbackType,
        metadata,
      });

      this.logger.log(`Email ${email.id} received complaint (feedback type: ${complaintFeedbackType})`);
    } catch (error) {
      this.logger.error(`Failed to process complaint event: ${error.message}`, error.stack);
      throw error;
    }
  }
}
