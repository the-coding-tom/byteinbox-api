import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { BroadcastRepository } from '../../repositories/broadcast.repository';
import { BROADCAST_PROCESSING_QUEUE } from '../../common/constants/queues.constant';

@Injectable()
export class ProcessScheduledBroadcasts {
  constructor(
    private readonly broadcastRepository: BroadcastRepository,
    @InjectQueue(BROADCAST_PROCESSING_QUEUE) private readonly broadcastProcessingQueue: Queue,
  ) {}

  private readonly logger = new Logger(ProcessScheduledBroadcasts.name);

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    this.logger.log('Checking for scheduled broadcasts ready to send');

    // Find scheduled broadcasts that are ready to be sent
    const readyBroadcasts = await this.broadcastRepository.findScheduledBroadcastsReadyToSend();

    if (readyBroadcasts.length === 0) {
      return;
    }

    this.logger.log(`Found ${readyBroadcasts.length} scheduled broadcasts ready to send`);

    // Enqueue each broadcast for processing
    for (const broadcast of readyBroadcasts) {
      await this.broadcastProcessingQueue.add(
        {
          broadcastId: broadcast.id,
          teamId: broadcast.teamId,
        },
        {
          removeOnComplete: true,
          attempts: 3,
        }
      );

      this.logger.log(`Enqueued broadcast ${broadcast.id} for processing`);
    }
  }
}
