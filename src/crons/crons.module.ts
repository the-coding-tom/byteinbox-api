import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { MfaVerificationSessionRepository } from '../repositories/mfa-verification-session.repository';
import { AutoExpireMfaSessions } from './processes/auto-expire-mfa-sessions.cron';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [
    MfaVerificationSessionRepository,
    AutoExpireMfaSessions,
  ],
})
export class CronsModule {}
