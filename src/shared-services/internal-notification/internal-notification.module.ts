import { Module } from '@nestjs/common';
import { InternalNotificationService } from './internal-notification.service';
import { QueueProducersModule } from '../../queues/queue-producers.module';

@Module({
  imports: [
    QueueProducersModule,
  ],
  providers: [InternalNotificationService],
  exports: [InternalNotificationService],
})
export class InternalNotificationModule {}

