import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { MfaRepository } from '../repositories/mfa.repository';
import { OtpCleanupCron } from './processes/otp-cleanup.cron';
import { OtpExpirationCron } from './processes/otp-expiration.cron';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [MfaRepository, OtpCleanupCron, OtpExpirationCron],
})
export class CronsModule {}
