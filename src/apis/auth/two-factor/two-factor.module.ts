import { Module } from '@nestjs/common';

import { TwoFactorController } from './two-factor.controller';
import { TwoFactorService } from './two-factor.service';
import { TwoFactorValidator } from './two-factor.validator';
import { RepositoriesModule } from '../../../repositories/repositories.module';
import { QueueProducersModule } from '../../../queues/queue-producers.module';

@Module({
  imports: [
    RepositoriesModule,
    QueueProducersModule,
  ],
  controllers: [TwoFactorController],
  providers: [TwoFactorService, TwoFactorValidator],
  exports: [TwoFactorService],
})
export class TwoFactorModule {} 