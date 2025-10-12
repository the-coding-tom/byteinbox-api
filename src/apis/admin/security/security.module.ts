import { Module } from '@nestjs/common';
import { AdminSecurityController } from './security.controller';
import { AdminSecurityService } from './security.service';
import { AdminSecurityValidator } from './security.validator';
import { BlacklistRepository } from '../../../repositories/blacklist.repository';
import { SessionRepository } from '../../../repositories/session.repository';
import { MfaVerificationSessionRepository } from '../../../repositories/mfa-verification-session.repository';
import { QueueProducersModule } from '../../../queues/queue-producers.module';

@Module({
  imports: [QueueProducersModule],
  controllers: [AdminSecurityController],
  providers: [
    AdminSecurityService,
    AdminSecurityValidator,
    BlacklistRepository,
    SessionRepository,
    MfaVerificationSessionRepository,
  ],
  exports: [AdminSecurityService],
})
export class AdminSecurityModule {} 