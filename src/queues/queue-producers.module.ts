import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { PROCESS_NOTIFICATION_QUEUE } from '../common/constants/queues.constant';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: PROCESS_NOTIFICATION_QUEUE },
    ),
  ],
  exports: [
    BullModule.registerQueue(
      { name: PROCESS_NOTIFICATION_QUEUE },
    ),
  ],
})
export class QueueProducersModule {}
