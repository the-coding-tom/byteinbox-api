import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { MfaVerificationSessionRepository } from '../repositories/mfa-verification-session.repository';
import { BroadcastRepository } from '../repositories/broadcast.repository';
import { AutoExpireMfaSessions } from './processes/auto-expire-mfa-sessions.cron';
import { ProcessScheduledBroadcasts } from './processes/process-scheduled-broadcasts.cron';
import { QueueProducersModule } from '../queues/queue-producers.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    QueueProducersModule,
  ],
  providers: [
    MfaVerificationSessionRepository,
    BroadcastRepository,
    AutoExpireMfaSessions,
    ProcessScheduledBroadcasts,
  ],
})
export class CronsModule {}
