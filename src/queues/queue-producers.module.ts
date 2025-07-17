import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import {
  PROCESS_FEATURE_QUEUE,
  PROCESS_NOTIFICATION_QUEUE,
  PROCESS_EMAIL_QUEUE,
  PROCESS_CASH_IN_PAYMENT_QUEUE,
  PROCESS_ADD_FUNDS_TO_ACCOUNT_QUEUE,
  PROCESS_CHECK_PAYMENT_STATUS_QUEUE,
  PROCESS_WEBHOOK_EVENT_QUEUE,
  PROCESS_CREATE_BLOCKCHAIN_TRANSACTION_QUEUE,
} from '../common/constants/queues.constant';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: PROCESS_FEATURE_QUEUE },
      { name: PROCESS_NOTIFICATION_QUEUE },
      { name: PROCESS_EMAIL_QUEUE },
      { name: PROCESS_CASH_IN_PAYMENT_QUEUE },
      { name: PROCESS_ADD_FUNDS_TO_ACCOUNT_QUEUE },
      { name: PROCESS_CHECK_PAYMENT_STATUS_QUEUE },
      { name: PROCESS_WEBHOOK_EVENT_QUEUE },
      { name: PROCESS_CREATE_BLOCKCHAIN_TRANSACTION_QUEUE },
    ),
  ],
  exports: [
    BullModule.registerQueue(
      { name: PROCESS_FEATURE_QUEUE },
      { name: PROCESS_NOTIFICATION_QUEUE },
      { name: PROCESS_EMAIL_QUEUE },
      { name: PROCESS_CASH_IN_PAYMENT_QUEUE },
      { name: PROCESS_ADD_FUNDS_TO_ACCOUNT_QUEUE },
      { name: PROCESS_CHECK_PAYMENT_STATUS_QUEUE },
      { name: PROCESS_WEBHOOK_EVENT_QUEUE },
      { name: PROCESS_CREATE_BLOCKCHAIN_TRANSACTION_QUEUE },
    ),
  ],
})
export class QueueProducersModule {}
