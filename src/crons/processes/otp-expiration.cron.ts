import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { MfaRepository } from '../../repositories/mfa.repository';

@Injectable()
export class OtpExpirationCron {
  private readonly logger = new Logger(OtpExpirationCron.name);

  constructor(private readonly mfaRepository: MfaRepository) {}

  @Cron(CronExpression.EVERY_5_MINUTES) // Changed from EVERY_MINUTE to reduce database load
  async handleOtpExpiration() {
    try {
      this.logger.debug('Starting OTP expiration cleanup...');
      
      // Expire OTP requests that have passed their expiration time
      const expiredCount = await this.mfaRepository.expireOtpRequests();
      
      if (expiredCount > 0) {
        this.logger.log(`Successfully expired ${expiredCount} OTP requests`);
      } else {
        this.logger.debug('No OTP requests to expire');
      }
    } catch (error) {
      this.logger.error('Error during OTP expiration:', error);
      
      // Don't throw the error to prevent the cron job from stopping
      // The error is logged and the job will continue on the next run
    }
  }
} 