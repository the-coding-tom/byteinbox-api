import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
// Import cron services as they are created
// import { PaymentStatusCheckerService } from './processes/payment-status-checker.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [
    // Cron services
    // PaymentStatusCheckerService,
  ],
})
export class CronsModule {}
