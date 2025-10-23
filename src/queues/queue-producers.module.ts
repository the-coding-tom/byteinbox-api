import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import {
  PROCESS_NOTIFICATION_QUEUE,
  VERIFY_DOMAIN_DNS_QUEUE,
  VERIFY_DOMAIN_AWS_QUEUE,
  SEND_EMAIL_QUEUE,
  PROCESS_EMAIL_EVENT_QUEUE
} from '../common/constants/queues.constant';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: PROCESS_NOTIFICATION_QUEUE },
      { name: VERIFY_DOMAIN_DNS_QUEUE },
      { name: VERIFY_DOMAIN_AWS_QUEUE },
      { name: SEND_EMAIL_QUEUE },
      { name: PROCESS_EMAIL_EVENT_QUEUE },
    ),
  ],
  exports: [
    BullModule.registerQueue(
      { name: PROCESS_NOTIFICATION_QUEUE },
      { name: VERIFY_DOMAIN_DNS_QUEUE },
      { name: VERIFY_DOMAIN_AWS_QUEUE },
      { name: SEND_EMAIL_QUEUE },
      { name: PROCESS_EMAIL_EVENT_QUEUE },
    ),
  ],
})
export class QueueProducersModule {}
