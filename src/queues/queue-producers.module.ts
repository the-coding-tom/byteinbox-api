import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { PROCESS_NOTIFICATION_QUEUE, VERIFY_DOMAIN_DNS_QUEUE } from '../common/constants/queues.constant';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: PROCESS_NOTIFICATION_QUEUE },
      { name: VERIFY_DOMAIN_DNS_QUEUE },
    ),
  ],
  exports: [
    BullModule.registerQueue(
      { name: PROCESS_NOTIFICATION_QUEUE },
      { name: VERIFY_DOMAIN_DNS_QUEUE },
    ),
  ],
})
export class QueueProducersModule {}
