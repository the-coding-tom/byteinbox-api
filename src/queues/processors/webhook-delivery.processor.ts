import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { DELIVER_WEBHOOK_QUEUE } from '../../common/constants/queues.constant';
import { WebhookRepository } from '../../repositories/webhook.repository';
import { publishWebhookEvent } from '../../helpers/webhook.helper';

const MAX_FAILURES_BEFORE_DISABLE = 10; // Disable webhook after 10 consecutive failures

@Processor(DELIVER_WEBHOOK_QUEUE)
export class WebhookDeliveryQueueProcessor {
  private readonly logger = new Logger(WebhookDeliveryQueueProcessor.name);

  constructor(
    private readonly webhookRepository: WebhookRepository,
  ) {}

  @Process('deliver-webhook')
  async handleWebhookDelivery(job: Job<any>) {
    const {
      webhookId,
      webhookUrl,
      webhookSecret,
      eventType,
      payload,
      messageId,
    } = job.data;

    const attemptNumber = job.attemptsMade + 1;

    this.logger.log(
      `Delivering webhook ${webhookId} for event ${eventType} (attempt ${attemptNumber}/5)`
    );

    let deliveryId: number | null = null;

    try {
      // Create delivery record
      deliveryId = await this.webhookRepository.createDelivery({
        webhookId,
        eventType,
        messageId,
        status: 'attempting',
        request: payload,
        attempts: attemptNumber,
      });

      // Publish webhook event via HTTP POST
      const result = await publishWebhookEvent(
        webhookUrl,
        payload,
        webhookSecret,
        `delivery_${deliveryId}`,
      );

      if (result.success) {
        // Update delivery record as success
        await this.webhookRepository.updateDelivery(deliveryId, {
          status: 'success',
          response: result.data,
          attempts: attemptNumber,
        });

        // Update webhook last triggered timestamp
        await this.webhookRepository.updateLastTriggered(webhookId);

        this.logger.log(
          `Successfully delivered webhook ${webhookId} for event ${eventType} (HTTP ${result.status})`
        );
      } else {
        // Update delivery record as failed
        await this.webhookRepository.updateDelivery(deliveryId, {
          status: 'fail',
          response: {
            status: result.status,
            data: result.data,
            error: result.error,
          },
          attempts: attemptNumber,
        });

        this.logger.warn(
          `Webhook ${webhookId} delivery failed for event ${eventType} (HTTP ${result.status || 'timeout'}): ${result.error}`
        );

        // Check if we should disable the webhook after repeated failures
        if (attemptNumber >= 5) {
          const recentFailures = await this.webhookRepository.countRecentFailures(webhookId);

          if (recentFailures >= MAX_FAILURES_BEFORE_DISABLE) {
            await this.webhookRepository.disable(webhookId);
            this.logger.warn(
              `Disabled webhook ${webhookId} after ${recentFailures} consecutive failures`
            );
          }
        }

        // Throw error to trigger Bull retry
        throw new Error(`Webhook delivery failed: ${result.error || 'HTTP ' + result.status}`);
      }
    } catch (error) {
      // Update delivery record if it was created
      if (deliveryId) {
        try {
          await this.webhookRepository.updateDelivery(deliveryId, {
            status: 'failed',
            response: {
              error: error.message,
            },
            attempts: attemptNumber,
          });
        } catch (updateError) {
          this.logger.error(`Failed to update delivery record: ${updateError.message}`);
        }
      }

      this.logger.error(
        `Error delivering webhook ${webhookId} for event ${eventType}: ${error.message}`,
        error.stack
      );

      // Re-throw to let Bull handle retries
      throw error;
    }
  }
}
