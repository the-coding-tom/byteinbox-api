import { Module } from '@nestjs/common';
import { AdminSecurityController } from './security.controller';
import { AdminSecurityService } from './security.service';
import { AdminSecurityValidator } from './security.validator';
import { BlacklistRepository } from '../../../repositories/blacklist.repository';
import { LoginActivityRepository } from '../../../repositories/login-activity.repository';
import { SessionRepository } from '../../../repositories/session.repository';
import { MfaRepository } from '../../../repositories/mfa.repository';
import { QueueProducersModule } from '../../../queues/queue-producers.module';

@Module({
  imports: [QueueProducersModule],
  controllers: [AdminSecurityController],
  providers: [
    AdminSecurityService,
    AdminSecurityValidator,
    BlacklistRepository,
    LoginActivityRepository,
    SessionRepository,
    MfaRepository,
  ],
  exports: [AdminSecurityService],
})
export class AdminSecurityModule {} 