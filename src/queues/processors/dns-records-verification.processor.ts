import { Processor, Process } from '@nestjs/bull';
import { InjectQueue } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bull';
import { DomainStatus } from '@prisma/client';

import * as psl from 'psl';
import { VERIFY_DOMAIN_DNS_QUEUE, VERIFY_DOMAIN_AWS_QUEUE } from '../../common/constants/queues.constant';
import { logInfoMessage, logError } from '../../utils/logger';
import { verifyDnsRecord } from '../../utils/dns-verification.util';
import { DomainRepository } from '../../repositories/domain.repository';
import { registerDomainWithSES, checkDomainExists, deleteDomainFromSES } from '../../helpers/aws-ses.helper';
import { config } from '../../config/config';

@Processor(VERIFY_DOMAIN_DNS_QUEUE)
export class DnsRecordsVerificationQueueProcessor {
  private readonly logger = new Logger(DnsRecordsVerificationQueueProcessor.name);

  constructor(
    private readonly domainRepository: DomainRepository,
    @InjectQueue(VERIFY_DOMAIN_DNS_QUEUE) private readonly verifyDnsQueue: Queue,
    @InjectQueue(VERIFY_DOMAIN_AWS_QUEUE) private readonly verifyAwsQueue: Queue,
  ) {
    this.logger.log('DnsRecordsVerificationQueueProcessor initialized and ready to process jobs');
  }

  /**
   * Extract root domain from full domain name
   * Example: marketing.weatherinbox.com -> weatherinbox.com
   */
  private extractRootDomain(domain: string): string {
    const parsed = psl.parse(domain);

    // Check if parsing failed (returns error result)
    if ('error' in parsed) {
      // Fallback: assume domain is already root or use as-is
      return domain;
    }

    // parsed is ParsedDomain at this point
    return parsed.domain || domain;
  }

  /**
   * Construct full hostname for DNS query
   * Example: domain=marketing.weatherinbox.com, recordName=send.marketing -> send.marketing.weatherinbox.com
   */
  private constructFullHostname(domain: string, recordName: string): string {
    const rootDomain = this.extractRootDomain(domain);
    return `${recordName}.${rootDomain}`;
  }

  @Process('verify-dns-records')
  async handleVerifyDnsRecords(job: Job<any>) {
    try {
      this.logger.log('Processing verify-dns-records job');
      logInfoMessage(`DnsRecordsVerificationQueueProcessor: Processing verify-dns-records - Job ID: ${job.id}, Data: ${JSON.stringify(job.data)}`);

      const { domainId, ttl } = job.data;

      // Check TTL timeout first (30 minutes from verification start)
      if (Date.now() > ttl) {
        this.logger.warn(`DNS verification timeout for domain ID ${domainId} (TTL expired)`);

        // Get domain to update status and notify
        const domain = await this.domainRepository.findById(domainId);
        if (domain) {
          await this.domainRepository.update(domainId, {
            status: DomainStatus.failed,
          });

          // Remove repeatable job properly
          await this.verifyDnsQueue.removeRepeatable('verify-dns-records', {
            every: config.domainVerification.dnsVerificationInterval,
            jobId: `dns-verification-${domainId}`,
          });
        }
        return;
      }

      // Get domain from database with DNS records
      const domain = await this.domainRepository.findById(domainId);
      if (!domain) {
        this.logger.error(`Domain not found: ${domainId}`);
        logError(`DnsRecordsVerificationQueueProcessor: Domain not found - Domain ID: ${domainId}, Job ID: ${job.id}`);
        return;
      }

      // Only process domains in verifying_dns or failed status
      if (domain.status !== DomainStatus.verifying_dns && domain.status !== DomainStatus.failed) {
        this.logger.log(`Domain ${domain.name} is not in verifying_dns or failed status, skipping`);
        return;
      }

      // Get required DNS records from database
      const dnsRecords = await this.domainRepository.findRequiredDnsRecordsByDomainId(domainId);

      // Verify each DNS record against authoritative nameservers
      const verificationResults = new Map<number, { verified: boolean }>();

      for (const record of dnsRecords) {
        // Construct full hostname for DNS query
        const fullHostname = this.constructFullHostname(domain.name, record.name);

        this.logger.log(`Verifying DNS record: ${record.record} - ${record.name} (querying: ${fullHostname})`);

        const result = await verifyDnsRecord(
          record.type,
          fullHostname,
          record.value,
          record.priority
        );

        // Update DNS record if verified
        if (result.verified && record.status !== DomainStatus.verified) {
          await this.domainRepository.updateDnsRecord(record.id, {
            status: DomainStatus.verified,
            lastCheckedAt: new Date(),
          });

          this.logger.log(
            `✓ DNS record ${record.record} for ${domain.name} verified: ${record.status} -> verified`
          );
        } else {
          // Update lastCheckedAt timestamp
          await this.domainRepository.updateDnsRecord(record.id, {
            lastCheckedAt: new Date(),
          });

          if (!result.verified) {
            this.logger.log(`✗ DNS record ${record.record} for ${domain.name} not yet verified`);
          }
        }

        verificationResults.set(record.id, { verified: result.verified });
      }

      // Check if all DNS records are verified
      const allVerified = Array.from(verificationResults.values()).every(result => result.verified);

      if (allVerified) {
        this.logger.log(`All DNS records verified for domain: ${domain.name}`);

        // Remove DNS verification repeatable job (no longer needed)
        await this.verifyDnsQueue.removeRepeatable('verify-dns-records', {
          every: config.domainVerification.dnsVerificationInterval,
          jobId: `dns-verification-${domainId}`,
        });

        // Check if domain exists in AWS SES and delete it (fresh start with new DKIM)
        const domainExistsInAws = await checkDomainExists(domain.name, domain.region);

        if (domainExistsInAws) {
          this.logger.log(`Domain ${domain.name} exists in AWS, deleting it before re-registration`);
          await deleteDomainFromSES(domain.name, domain.region);
          this.logger.log(`Deleted domain ${domain.name} from AWS SES`);
        }

        // Set all other domains with the same name to not_started (they need to re-verify)
        await this.domainRepository.resetOtherDomainsToVerifying(domain.id, domain.name);
        this.logger.log(`Reset all other team domains with name ${domain.name} to not_started`);

        // Register domain with AWS SES using this team's DKIM keys
        await registerDomainWithSES(
          domain.name,
          domain.dkimSelector,
          domain.dkimPrivateKey,
          domain.region
        );

        // Update domain status to verifying_aws_setup
        await this.domainRepository.update(domainId, {
          status: DomainStatus.verifying_aws_setup,
          awsRegisteredAt: new Date(),
        });

        // Enqueue for AWS verification with TTL (repeatable)
        await this.verifyAwsQueue.add(
          'verify-aws-status',
          {
            domainId: domain.id,
            ttl: Date.now() + config.domainVerification.ttl,
          },
          {
            jobId: `aws-verification-${domain.id}`,
            repeat: {
              every: config.domainVerification.awsVerificationInterval,
            },
          }
        );

        this.logger.log(`Domain ${domain.name} DNS verified, registered with AWS, and queued for AWS verification`);
      } else {
        // Not all DNS records are verified yet - job will repeat automatically
        const verifiedCount = Array.from(verificationResults.values()).filter(result => result.verified).length;
        this.logger.log(`DNS verification in progress for ${domain.name}: ${verifiedCount}/${dnsRecords.length} records verified`);
      }

    } catch (error) {
      this.logger.error(`Failed to process verify-dns-records: ${error.message}`);
      logError(`DnsRecordsVerificationQueueProcessor: Failed to process verify-dns-records - Job ID: ${job.id}, Error: ${error.message}`);
      throw error; // Let Bull handle retries
    }
  }
}
