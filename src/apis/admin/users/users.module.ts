import { Module } from '@nestjs/common';
import { AdminUsersController } from './users.controller';
import { AdminUsersService } from './users.service';
import { AdminUsersValidator } from './users.validator';
import { UserRepository } from '../../../repositories/user.repository';
import { SessionRepository } from '../../../repositories/session.repository';
import { MfaVerificationSessionRepository } from '../../../repositories/mfa-verification-session.repository';
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
    MfaVerificationSessionRepository,
    BlacklistRepository,
  ],
  exports: [AdminUsersService],
})
export class AdminUsersModule {} 