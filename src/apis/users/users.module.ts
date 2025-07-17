import { Module } from '@nestjs/common';

import { QueueProducersModule } from '../../queues/queue-producers.module';
import { RepositoriesModule } from '../../repositories/repositories.module';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersValidator } from './users.validator';

@Module({
  imports: [RepositoriesModule, QueueProducersModule],
  controllers: [UsersController],
  providers: [UsersService, UsersValidator],
})
export class UsersModule {}
