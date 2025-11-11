import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { WebhookRepository } from '../../repositories/webhook.repository';
import { DELIVER_WEBHOOK_QUEUE } from '../../common/constants/queues.constant';
import { buildWebhookPayload } from '../../helpers/webhook.helper';

@Injectable()
export class WebhookPublisherService {
  private readonly logger = new Logger(WebhookPublisherService.name);

  constructor(
    private readonly webhookRepository: WebhookRepository,
    @InjectQueue(DELIVER_WEBHOOK_QUEUE) private readonly webhookQueue: Queue,
  ) {}

  /**
   * Publish an event to all matching webhooks for a team
   * @param teamId - Team ID
   * @param eventType - Event type (e.g., 'email.delivered')
   * @param eventData - Event-specific data
   * @param messageId - Optional message ID for email events
   */
  async publishEvent(
    teamId: number,
    eventType: string,
    eventData: any,
    messageId?: string,
  ): Promise<void> {
    try {
      // Find all active webhooks for this team that are subscribed to this event type
      const webhooks = await this.webhookRepository.findActiveByTeamAndEvent(teamId, eventType);

      if (webhooks.length === 0) {
        this.logger.debug(`No active webhooks found for team ${teamId} and event ${eventType}`);
        return;
      }

      this.logger.log(`Publishing event ${eventType} to ${webhooks.length} webhook(s) for team ${teamId}`);

      // Build the standardized payload
      const payload = buildWebhookPayload(eventType, eventData);

      // Queue delivery jobs for each webhook
      const deliveryPromises = webhooks.map(async (webhook) => {
        return this.webhookQueue.add('deliver-webhook', {
          webhookId: webhook.id,
          webhookUrl: webhook.url,
          webhookSecret: webhook.secret,
          eventType,
          payload,
          messageId,
        }, {
          attempts: 5, // 5 retry attempts total
          backoff: {
            type: 'exponential',
            delay: 60000, // Start with 1 minute delay
          },
          removeOnComplete: true,
          removeOnFail: false, // Keep failed jobs for debugging
        });
      });

      await Promise.all(deliveryPromises);

      this.logger.log(`Queued ${webhooks.length} webhook deliveries for event ${eventType}`);
    } catch (error) {
      this.logger.error(
        `Error publishing event ${eventType} for team ${teamId}: ${error.message}`,
        error.stack,
      );
      // Don't throw - webhook failures shouldn't block event processing
    }
  }
}
