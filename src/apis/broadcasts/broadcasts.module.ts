import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { BroadcastsController } from './broadcasts.controller';
import { BroadcastsService } from './broadcasts.service';
import { BroadcastsValidator } from './broadcasts.validator';
import { RepositoriesModule } from '../../repositories/repositories.module';
import { BROADCAST_PROCESSING_QUEUE } from '../../common/constants/queues.constant';

@Module({
  imports: [
    RepositoriesModule,
    BullModule.registerQueue({
      name: BROADCAST_PROCESSING_QUEUE,
    }),
  ],
  controllers: [BroadcastsController],
  providers: [BroadcastsService, BroadcastsValidator],
  exports: [BroadcastsService],
})
export class BroadcastsModule {}
