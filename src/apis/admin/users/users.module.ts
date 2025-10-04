import { Module } from '@nestjs/common';
import { AdminUsersController } from './users.controller';
import { AdminUsersService } from './users.service';
import { AdminUsersValidator } from './users.validator';
import { UserRepository } from '../../../repositories/user.repository';
import { SessionRepository } from '../../../repositories/session.repository';
import { MfaRepository } from '../../../repositories/mfa.repository';
import { BlacklistRepository } from '../../../repositories/blacklist.repository';
import { QueueProducersModule } from '../../../queues/queue-producers.module';

@Module({
  imports: [QueueProducersModule],
  controllers: [AdminUsersController],
  providers: [
    AdminUsersService,
    AdminUsersValidator,
    UserRepository,
    SessionRepository,
    MfaRepository,
    BlacklistRepository,
  ],
  exports: [AdminUsersService],
})
export class AdminUsersModule {} 