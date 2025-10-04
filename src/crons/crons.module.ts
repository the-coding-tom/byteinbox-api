import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { MfaRepository } from '../repositories/mfa.repository';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [MfaRepository],
})
export class CronsModule {}
