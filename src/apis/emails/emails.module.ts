import { Module } from '@nestjs/common';
import { EmailsController } from './emails.controller';
import { EmailsService } from './emails.service';
import { EmailsValidator } from './emails.validator';
import { RepositoriesModule } from '../../repositories/repositories.module';
import { QueueProducersModule } from '../../queues/queue-producers.module';

@Module({
  imports: [RepositoriesModule, QueueProducersModule],
  controllers: [EmailsController],
  providers: [EmailsService, EmailsValidator],
  exports: [EmailsService],
})
export class EmailsModule {}
