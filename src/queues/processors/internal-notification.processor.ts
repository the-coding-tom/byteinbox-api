import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { INTERNAL_NOTIFICATION_QUEUE } from '../../common/constants/queues.constant';
import { SendInternalEmailPayload } from '../../shared-services/internal-notification/internal-notification.service';
import { sendEmailToSingleRecipient } from '../../helpers/aws-ses.helper';
import { config } from '../../config/config';

/**
 * Internal Notification Processor
 *
 * Processes internal system notifications (email verification, password reset, etc.)
 * Sends emails from thomas@byteinbox.com using AWS SES
 * No domain validation or complex routing - just queue and send
 */
@Processor(INTERNAL_NOTIFICATION_QUEUE)
export class InternalNotificationProcessor {
  private readonly logger = new Logger(InternalNotificationProcessor.name);

  @Process('send-internal-email')
  async handleSendInternalEmail(job: Job<SendInternalEmailPayload>) {
    const { to, subject, html, text } = job.data;

    try {
      this.logger.log(`Sending internal email to ${to}: ${subject}`);

      await sendEmailToSingleRecipient({
        from: 'ByteInbox <thomas@byteinbox.com>',
        actualRecipient: to,
        displayTo: [to],
        subject,
        html,
        text,
        region: config.aws.ses.defaultRegion,
        configurationSetName: config.aws.ses.configurationSetName,
      });

      this.logger.log(`Successfully sent internal email to ${to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send internal email to ${to}: ${error.message}`,
        error.stack,
      );
      throw error; // Will trigger retry
    }
  }
}

