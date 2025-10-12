import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Constants } from '../../common/enums/generic.enum';
import { MfaVerificationSessionRepository } from '../../repositories/mfa-verification-session.repository';

@Injectable()
export class AutoExpireMfaSessions {
  constructor(private readonly mfaVerificationSessionRepository: MfaVerificationSessionRepository) {}

  private readonly logger = new Logger(AutoExpireMfaSessions.name);

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    this.logger.log(Constants.successCronMessage);
    // Update all MFA sessions that are past their expiration time
    await this.mfaVerificationSessionRepository.markExpiredSessionsAsExpired();
  }
}

