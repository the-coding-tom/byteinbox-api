import { Module } from '@nestjs/common';

import { RepositoriesModule } from '../repositories/repositories.module';

import { NotificationQueueProcessor } from './processors/notification.processor';
import { AwsVerificationQueueProcessor } from './processors/domain-verification.processor';
import { DnsVerificationQueueProcessor } from './processors/dns-verification.processor';
import { EmailSendingQueueProcessor } from './processors/email-sending.processor';
import { EmailEventQueueProcessor } from './processors/email-event.processor';
import { QueueProducersModule } from './queue-producers.module';

@Module({
  imports: [
    QueueProducersModule, // Import queues from producers module
    RepositoriesModule, // Processors need access to repositories
  ],
  providers: [
    // Queue processors
    NotificationQueueProcessor,
    AwsVerificationQueueProcessor,
    DnsVerificationQueueProcessor,
    EmailSendingQueueProcessor,
    EmailEventQueueProcessor,
  ],
  exports: [
    NotificationQueueProcessor,
    AwsVerificationQueueProcessor,
    DnsVerificationQueueProcessor,
    EmailSendingQueueProcessor,
    EmailEventQueueProcessor,
  ],
})
export class QueueProcessorsModule {}
