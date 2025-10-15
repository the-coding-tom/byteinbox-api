import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { DomainStatus } from '@prisma/client';

import { VERIFY_DOMAIN_DNS_QUEUE } from '../../common/constants/queues.constant';
import { logInfoMessage, logError } from '../../utils/logger';
import { getDomainVerificationStatus } from '../../helpers/aws-ses.helper';
import { DomainRepository } from '../../repositories/domain.repository';

@Processor(VERIFY_DOMAIN_DNS_QUEUE)
export class DomainVerificationQueueProcessor {
  private readonly logger = new Logger(DomainVerificationQueueProcessor.name);

  constructor(private readonly domainRepository: DomainRepository) {
    this.logger.log('DomainVerificationQueueProcessor initialized and ready to process jobs');
  }

  @Process('verify-domain-dns')
  async handleVerifyDomainDns(job: Job<any>) {
    try {
      this.logger.log('Processing verify-domain-dns job');
      logInfoMessage(`DomainVerificationQueueProcessor: Processing verify-domain-dns - Job ID: ${job.id}, Data: ${JSON.stringify(job.data)}`);

      const { domainId } = job.data;

      // Get domain from database
      const domain = await this.domainRepository.findById(domainId);
      if (!domain) {
        this.logger.error(`Domain not found: ${domainId}`);
        logError(`DomainVerificationQueueProcessor: Domain not found - Domain ID: ${domainId}, Job ID: ${job.id}`);
        return;
      }

      // Get verification status from AWS SES
      const awsStatus = await getDomainVerificationStatus(
        domain.name,
        domain.region || 'us-east-1'
      );

      this.logger.log(`AWS Status for ${domain.name}: DKIM=${awsStatus.dkimStatus}, MailFrom=${awsStatus.mailFromStatus}`);

      // Get all DNS records for this domain
      const dnsRecords = await this.domainRepository.findDnsRecordsByDomainId(domainId);

      // Track updated statuses
      const updatedStatuses = new Map<number, DomainStatus>();

      // Update each DNS record based on AWS status
      for (const record of dnsRecords) {
        let recordStatus: DomainStatus = DomainStatus.pending;

        switch (record.type) {
          case 'dkim':
            recordStatus = awsStatus.dkimStatus === 'SUCCESS' ? DomainStatus.verified : DomainStatus.pending;
            if (awsStatus.dkimStatus === 'FAILED') {
              recordStatus = DomainStatus.failed;
            }
            break;

          case 'spf':
          case 'mx':
            recordStatus = awsStatus.mailFromStatus === 'SUCCESS' ? DomainStatus.verified : DomainStatus.pending;
            if (awsStatus.mailFromStatus === 'FAILED') {
              recordStatus = DomainStatus.failed;
            }
            break;

          case 'dmarc':
            // DMARC verification is not directly tracked by AWS SES
            // Typically, it's verified if DKIM and SPF are verified
            recordStatus =
              awsStatus.dkimStatus === 'SUCCESS' && awsStatus.mailFromStatus === 'SUCCESS'
                ? DomainStatus.verified
                : DomainStatus.pending;
            break;
        }

        // Update DNS record status if changed
        if (record.status !== recordStatus) {
          await this.domainRepository.updateDnsRecord(record.id, {
            status: recordStatus,
            lastCheckedAt: new Date(),
          });

          this.logger.log(`Updated DNS record ${record.type} for ${domain.name}: ${record.status} -> ${recordStatus}`);
        }

        // Track the status (either updated or existing)
        updatedStatuses.set(record.id, recordStatus);
      }

      // Update overall domain status based on all record statuses
      const allStatuses = Array.from(updatedStatuses.values());
      const allVerified = allStatuses.every(status => status === DomainStatus.verified);
      const anyFailed = allStatuses.some(status => status === DomainStatus.failed);

      let newDomainStatus: DomainStatus = DomainStatus.pending;
      if (allVerified && awsStatus.verifiedForSendingStatus) {
        newDomainStatus = DomainStatus.verified;
      } else if (anyFailed) {
        newDomainStatus = DomainStatus.failed;
      }

      if (domain.status !== newDomainStatus) {
        await this.domainRepository.update(domainId, {
          status: newDomainStatus,
        });

        this.logger.log(`Updated domain ${domain.name} status: ${domain.status} -> ${newDomainStatus}`);
      }

      this.logger.log(`Verification check completed for domain: ${domain.name}`);
      const duration = Date.now() - job.timestamp;
      logInfoMessage(`DomainVerificationQueueProcessor: Verification completed for domain ${domain.name} - Duration: ${duration}ms`);

    } catch (error) {
      this.logger.error(`Failed to process verify-domain-dns: ${error}`);
      logError(`DomainVerificationQueueProcessor: Failed to process verify-domain-dns - Job ID: ${job.id}, Error: ${error}`);
      throw error; // Let Bull handle retries
    }
  }
}
