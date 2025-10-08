import { Module } from '@nestjs/common';
import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';
import { LogsValidator } from './logs.validator';
import { RepositoriesModule } from '../../repositories/repositories.module';

@Module({
  imports: [RepositoriesModule],
  controllers: [LogsController],
  providers: [LogsService, LogsValidator],
  exports: [LogsService],
})
export class LogsModule {}
