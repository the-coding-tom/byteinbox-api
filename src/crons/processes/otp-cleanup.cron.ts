// import { Injectable } from '@nestjs/common';
// import { Cron, CronExpression } from '@nestjs/schedule';

// import { MfaRepository } from '../../repositories/mfa.repository';

// @Injectable()
// export class OtpCleanupCron {
//   constructor(private readonly mfaRepository: MfaRepository) {}

//   @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
//   async handleOtpCleanup() {
//     try {
//       // Clean up old OTP requests (older than 30 days)
//       await this.mfaRepository.cleanupOldOtpRequests(30);

//       // Clean up expired rate limits
//       await this.mfaRepository.cleanupExpiredRateLimits();

//       console.log('OTP cleanup completed successfully');
//     } catch (error) {
//       console.error('Error during OTP cleanup:', error);
//     }
//   }
// } 