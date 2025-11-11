import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import {
  PROCESS_NOTIFICATION_QUEUE,
  VERIFY_DOMAIN_DNS_QUEUE,
  VERIFY_DOMAIN_AWS_QUEUE,
  EMAIL_ROUTER_QUEUE,
  EMAIL_TEMPLATE_QUEUE,
  EMAIL_ATTACHMENT_QUEUE,
  SEND_EMAIL_QUEUE,
  BROADCAST_PROCESSING_QUEUE,
  PROCESS_EMAIL_EVENT_QUEUE,
  GENERATE_TEMPLATE_PREVIEW_QUEUE,
  DELIVER_WEBHOOK_QUEUE
} from '../common/constants/queues.constant';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: PROCESS_NOTIFICATION_QUEUE },
      { name: VERIFY_DOMAIN_DNS_QUEUE },
      { name: VERIFY_DOMAIN_AWS_QUEUE },
      { name: EMAIL_ROUTER_QUEUE },
      { name: EMAIL_TEMPLATE_QUEUE },
      { name: EMAIL_ATTACHMENT_QUEUE },
      { name: SEND_EMAIL_QUEUE },
      { name: BROADCAST_PROCESSING_QUEUE },
      { name: PROCESS_EMAIL_EVENT_QUEUE },
      { name: GENERATE_TEMPLATE_PREVIEW_QUEUE },
      { name: DELIVER_WEBHOOK_QUEUE },
    ),
  ],
  exports: [
    BullModule.registerQueue(
      { name: PROCESS_NOTIFICATION_QUEUE },
      { name: VERIFY_DOMAIN_DNS_QUEUE },
      { name: VERIFY_DOMAIN_AWS_QUEUE },
      { name: EMAIL_ROUTER_QUEUE },
      { name: EMAIL_TEMPLATE_QUEUE },
      { name: EMAIL_ATTACHMENT_QUEUE },
      { name: SEND_EMAIL_QUEUE },
      { name: BROADCAST_PROCESSING_QUEUE },
      { name: PROCESS_EMAIL_EVENT_QUEUE },
      { name: GENERATE_TEMPLATE_PREVIEW_QUEUE },
      { name: DELIVER_WEBHOOK_QUEUE },
    ),
  ],
})
export class QueueProducersModule {}
