import { Processor, Process } from '@nestjs/bull';
import { InjectQueue } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bull';
import { DomainStatus } from '@prisma/client';

import { VERIFY_DOMAIN_AWS_QUEUE } from '../../common/constants/queues.constant';
import { logInfoMessage, logError } from '../../utils/logger';
import { getDomainVerificationStatus } from '../../helpers/aws-ses.helper';
import { DomainRepository } from '../../repositories/domain.repository';
import { notifyDomainVerified, notifyDomainFailed } from '../../helpers/notification.helper';
import { config } from '../../config/config';

@Processor(VERIFY_DOMAIN_AWS_QUEUE)
export class AwsVerificationQueueProcessor {
  private readonly logger = new Logger(AwsVerificationQueueProcessor.name);

  constructor(
    private readonly domainRepository: DomainRepository,
    @InjectQueue(VERIFY_DOMAIN_AWS_QUEUE) private readonly verifyAwsQueue: Queue,
  ) {
    this.logger.log('AwsVerificationQueueProcessor initialized and ready to process jobs');
  }

  @Process('verify-aws-status')
  async handleVerifyAwsStatus(job: Job<any>) {
    try {
      this.logger.log('Processing verify-aws-status job');
      logInfoMessage(`AwsVerificationQueueProcessor: Processing verify-aws-status - Job ID: ${job.id}, Data: ${JSON.stringify(job.data)}`);

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

          // Notify team about failure
          await notifyDomainFailed(domain.teamId, domain.name, domain.id, 'AWS verification timeout (30 minutes exceeded)');
        }
        return;
      }

      // Get domain from database with DNS records
      const domain = await this.domainRepository.findById(domainId);
      if (!domain) {
        this.logger.error(`Domain not found: ${domainId}`);
        logError(`AwsVerificationQueueProcessor: Domain not found - Domain ID: ${domainId}, Job ID: ${job.id}`);
        return;
      }

      // Only process domains in pending_aws status
      if (domain.status !== DomainStatus.pending_aws) {
        this.logger.log(`Domain ${domain.name} is not in pending_aws status, skipping`);
        return;
      }

      // Get verification status from AWS SES
      const awsStatus = await getDomainVerificationStatus(
        domain.name,
        domain.region
      );

      this.logger.log(`AWS Status for ${domain.name}: DKIM=${awsStatus.dkimStatus}, MailFrom=${awsStatus.mailFromStatus}, VerifiedForSending=${awsStatus.verifiedForSendingStatus}`);

      // Check if domain is fully verified by AWS
      const isDkimVerified = awsStatus.dkimStatus === 'SUCCESS';
      const isMailFromVerified = awsStatus.mailFromStatus === 'SUCCESS';
      const isVerifiedForSending = awsStatus.verifiedForSendingStatus === true;

      if (isDkimVerified && isMailFromVerified && isVerifiedForSending) {
        // Domain is fully verified!
        await this.domainRepository.update(domainId, {
          status: DomainStatus.verified,
        });

        // Update all DNS records to verified status (use records from domain)
        for (const record of domain.dnsRecords) {
          await this.domainRepository.updateDnsRecord(record.id, {
            status: DomainStatus.verified,
            lastCheckedAt: new Date(),
          });
        }

        // Remove repeatable job (verification complete)
        await this.verifyAwsQueue.removeRepeatable('verify-aws-status', {
          every: config.domainVerification.awsVerificationInterval,
          jobId: `aws-verification-${domainId}`,
        });

        // Notify team about successful verification
        await notifyDomainVerified(domain.teamId, domain.name, domain.id);

        this.logger.log(`✓ Domain ${domain.name} is now fully verified!`);
      } else if (awsStatus.dkimStatus === 'FAILED' || awsStatus.mailFromStatus === 'FAILED') {
        // AWS verification failed
        await this.domainRepository.update(domainId, {
          status: DomainStatus.failed,
        });

        // Remove repeatable job (verification failed)
        await this.verifyAwsQueue.removeRepeatable('verify-aws-status', {
          every: config.domainVerification.awsVerificationInterval,
          jobId: `aws-verification-${domainId}`,
        });

        const failureReason = `AWS verification failed: DKIM=${awsStatus.dkimStatus}, MailFrom=${awsStatus.mailFromStatus}`;

        // Notify team about failure
        await notifyDomainFailed(domain.teamId, domain.name, domain.id, failureReason);

        this.logger.error(`✗ Domain ${domain.name} AWS verification failed`);
      } else {
        // Still pending - job will repeat automatically
        this.logger.log(`Domain ${domain.name} AWS verification still pending...`);
      }

      const duration = Date.now() - job.timestamp;
      logInfoMessage(`AwsVerificationQueueProcessor: AWS verification check completed for domain ${domain.name} - Duration: ${duration}ms`);

    } catch (error) {
      this.logger.error(`Failed to process verify-aws-status: ${error.message}`);
      logError(`AwsVerificationQueueProcessor: Failed to process verify-aws-status - Job ID: ${job.id}, Error: ${error.message}`);
      throw error; // Let Bull handle retries
    }
  }
}
