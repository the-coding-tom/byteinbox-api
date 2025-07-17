import { Module } from '@nestjs/common';

import { RepositoriesModule } from '../repositories/repositories.module';

import { NotificationQueueProcessor } from './processors/notification.processor';
// Import other processors as they are created
// import { FeatureQueueProcessor } from './processors/feature.processor';
// import { EmailQueueProcessor } from './processors/email.processor';
import { QueueProducersModule } from './queue-producers.module';

@Module({
  imports: [
    QueueProducersModule, // Import queues from producers module
    RepositoriesModule, // Processors need access to repositories
  ],
  providers: [
    // Queue processors
    NotificationQueueProcessor,
    // FeatureQueueProcessor,
    // EmailQueueProcessor,
  ],
  exports: [
    NotificationQueueProcessor,
    // FeatureQueueProcessor,
    // EmailQueueProcessor,
  ],
})
export class QueueProcessorsModule {}
