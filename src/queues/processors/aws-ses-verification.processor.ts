import { Processor, Process } from '@nestjs/bull';
import { InjectQueue } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bull';
import { DomainStatus } from '@prisma/client';

import { VERIFY_DOMAIN_AWS_QUEUE } from '../../common/constants/queues.constant';
import { AwsSesVerificationStatus } from '../../common/enums/generic.enum';
import { logError } from '../../utils/logger';
import { getDomainVerificationStatus } from '../../helpers/aws-ses.helper';
import { DomainRepository } from '../../repositories/domain.repository';
import { config } from '../../config/config';

@Processor(VERIFY_DOMAIN_AWS_QUEUE)
export class AwsSesVerificationQueueProcessor {
  private readonly logger = new Logger(AwsSesVerificationQueueProcessor.name);

  constructor(
    private readonly domainRepository: DomainRepository,
    @InjectQueue(VERIFY_DOMAIN_AWS_QUEUE) private readonly verifyAwsQueue: Queue,
  ) {
    this.logger.log('AwsSesVerificationQueueProcessor initialized and ready to process jobs');
  }

  @Process('verify-aws-status')
  async handleVerifyAwsStatus(job: Job<any>) {
    try {
      this.logger.log('Processing verify-aws-status job');

      const { domainId, ttl } = job.data;

      // Check TTL timeout first (30 minutes from AWS registration)
      if (Date.now() > ttl) {
        this.logger.warn(`AWS verification timeout for domain ID ${domainId} (TTL expired)`);

        // Get domain to update status and notify
        const domain = await this.domainRepository.findById(domainId);
        if (domain) {
          await this.domainRepository.update(domainId, {
            status: DomainStatus.failed,
          });

          // Remove repeatable job properly
          await this.verifyAwsQueue.removeRepeatable('verify-aws-status', {
            every: config.domainVerification.awsVerificationInterval,
            jobId: `aws-verification-${domainId}`,
          });
        }
        return;
      }

      // Get domain from database with DNS records
      const domain = await this.domainRepository.findById(domainId);
      if (!domain) {
        this.logger.error(`Domain not found: ${domainId}`);
        logError(`AwsSesVerificationQueueProcessor: Domain not found - Domain ID: ${domainId}, Job ID: ${job.id}`);
        return;
      }

      // Only process domains in verifying_aws_setup status
      if (domain.status !== DomainStatus.verifying_aws_setup) {
        this.logger.log(`Domain ${domain.name} is not in verifying_aws_setup status, skipping`);
        return;
      }

      // Get verification status from AWS SES
      const awsStatus = await getDomainVerificationStatus(
        domain.name,
        domain.region
      );

      this.logger.log(`AWS Status for ${domain.name}: DKIM=${awsStatus.dkimStatus}, MailFrom=${awsStatus.mailFromStatus}, VerifiedForSending=${awsStatus.verifiedForSendingStatus}`);

      // Check if domain is fully verified by AWS
      const isDkimVerified = awsStatus.dkimStatus === AwsSesVerificationStatus.success;
      const isMailFromVerified = awsStatus.mailFromStatus === AwsSesVerificationStatus.success;
      const isVerifiedForSending = awsStatus.verifiedForSendingStatus === true;

      if (isDkimVerified && isMailFromVerified && isVerifiedForSending) {
        await this.domainRepository.updateDomainAndDnsRecordsToVerified(domainId);

        await this.verifyAwsQueue.removeRepeatable('verify-aws-status', {
          every: config.domainVerification.awsVerificationInterval,
          jobId: `aws-verification-${domainId}`,
        });

        this.logger.log(`Domain ${domain.name} verified`);
      }
    } catch (error) {
      this.logger.error(`Failed to process verify-aws-status: ${error.message}`);
      throw error; // Let Bull handle retries
    }
  }
}
