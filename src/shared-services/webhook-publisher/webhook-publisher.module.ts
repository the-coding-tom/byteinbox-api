import { Module } from '@nestjs/common';
import { WebhookPublisherService } from './webhook-publisher.service';
import { RepositoriesModule } from '../../repositories/repositories.module';
import { QueueProducersModule } from '../../queues/queue-producers.module';

@Module({
  imports: [
    RepositoriesModule,
    QueueProducersModule,
  ],
  providers: [
    WebhookPublisherService,
  ],
  exports: [
    WebhookPublisherService,
  ],
})
export class WebhookPublisherModule {}
