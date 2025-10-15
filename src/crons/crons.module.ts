import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { MfaVerificationSessionRepository } from '../repositories/mfa-verification-session.repository';
import { DomainRepository } from '../repositories/domain.repository';
import { AutoExpireMfaSessions } from './processes/auto-expire-mfa-sessions.cron';
import { VerifyDomainDnsCron } from './processes/verify-domain-dns.cron';
import { QueueProducersModule } from '../queues/queue-producers.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    QueueProducersModule, // Needed for queue injection
  ],
  providers: [
    MfaVerificationSessionRepository,
    DomainRepository,
    AutoExpireMfaSessions,
    VerifyDomainDnsCron,
  ],
})
export class CronsModule {}
