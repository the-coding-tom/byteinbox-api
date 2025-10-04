import { Module } from '@nestjs/common';
import { CoreAuthController } from './core-auth.controller';
import { CoreAuthService } from './core-auth.service';
import { CoreAuthValidator } from './core-auth.validator';
import { RepositoriesModule } from '../../../repositories/repositories.module';
import { QueueProducersModule } from '../../../queues/queue-producers.module';

@Module({
  imports: [
    RepositoriesModule,
    QueueProducersModule,
  ],
  controllers: [CoreAuthController],
  providers: [CoreAuthService, CoreAuthValidator],
  exports: [CoreAuthService],
})
export class CoreAuthModule {} 