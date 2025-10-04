import { Module } from '@nestjs/common';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';
import { ApiKeysValidator } from './api-keys.validator';
import { RepositoriesModule } from '../../repositories/repositories.module';
import { QueueProducersModule } from '../../queues/queue-producers.module';

@Module({
  imports: [RepositoriesModule, QueueProducersModule],
  controllers: [ApiKeysController],
  providers: [ApiKeysService, ApiKeysValidator],
  exports: [ApiKeysService],
})
export class ApiKeysModule {} 