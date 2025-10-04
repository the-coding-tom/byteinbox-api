import { Module } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { SessionsValidator } from './sessions.validator';
import { RepositoriesModule } from '../../../repositories/repositories.module';

@Module({
  imports: [RepositoriesModule],
  controllers: [SessionsController],
  providers: [SessionsService, SessionsValidator],
  exports: [SessionsService],
})
export class SessionsModule {} 