import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import { Constants } from '../../common/enums/generic.enum';
import { VERIFY_DOMAIN_DNS_QUEUE } from '../../common/constants/queues.constant';
import { DomainRepository } from '../../repositories/domain.repository';

@Injectable()
export class VerifyDomainDnsCron {
  constructor(
    private readonly domainRepository: DomainRepository,
    @InjectQueue(VERIFY_DOMAIN_DNS_QUEUE) private readonly verifyDomainQueue: Queue,
  ) {}

  private readonly logger = new Logger(VerifyDomainDnsCron.name);

  // Run every 5 minutes to check for unverified DNS records
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCron() {
    this.logger.log('Starting domain DNS verification cron job');

    try {
      // Find all domains that are not fully verified (pending or failed)
      const unverifiedDomains = await this.domainRepository.findDomainsWithUnverifiedDnsRecords();

      this.logger.log(`Found ${unverifiedDomains.length} domains with unverified DNS records`);

      // Queue each domain for verification
      for (const domain of unverifiedDomains) {
        await this.verifyDomainQueue.add(
          'verify-domain-dns',
          { domainId: domain.id },
          {
            attempts: 3, // Retry up to 3 times
            backoff: {
              type: 'exponential',
              delay: 2000, // Start with 2 second delay
            },
            removeOnComplete: true, // Clean up completed jobs
            removeOnFail: false, // Keep failed jobs for debugging
          }
        );

        this.logger.log(`Queued domain for verification: ${domain.name} (ID: ${domain.id})`);
      }

      this.logger.log(`${Constants.successCronMessage} - Queued ${unverifiedDomains.length} domains for DNS verification`);
    } catch (error) {
      this.logger.error(`Error in domain DNS verification cron: ${error.message}`);
      throw error;
    }
  }
}
