import { Module } from '@nestjs/common';
import { PasswordController } from './password.controller';
import { PasswordService } from './password.service';
import { PasswordValidator } from './password.validator';
import { RepositoriesModule } from '../../../repositories/repositories.module';
import { QueueProducersModule } from '../../../queues/queue-producers.module';

@Module({
  imports: [
    RepositoriesModule,
    QueueProducersModule,
  ],
  controllers: [PasswordController],
  providers: [PasswordService, PasswordValidator],
  exports: [PasswordService],
})
export class PasswordModule {} 