import { Module } from '@nestjs/common';
import { BroadcastsController } from './broadcasts.controller';
import { BroadcastsService } from './broadcasts.service';
import { BroadcastsValidator } from './broadcasts.validator';
import { RepositoriesModule } from '../../repositories/repositories.module';

@Module({
  imports: [RepositoriesModule],
  controllers: [BroadcastsController],
  providers: [BroadcastsService, BroadcastsValidator],
  exports: [BroadcastsService],
})
export class BroadcastsModule {}
