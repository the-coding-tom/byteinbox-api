import { Processor, Process } from '@nestjs/bull';
import { InjectQueue } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bull';
import { DomainStatus } from '@prisma/client';

import { VERIFY_DOMAIN_DNS_QUEUE, VERIFY_DOMAIN_AWS_QUEUE } from '../../common/constants/queues.constant';
import { logInfoMessage, logError } from '../../utils/logger';
import { verifyDnsRecord } from '../../utils/dns-verification.util';
import { DomainRepository } from '../../repositories/domain.repository';
import { registerDomainWithSES, checkDomainExists, deleteDomainFromSES } from '../../helpers/aws-ses.helper';
import {
  notifyDomainDnsVerified,
  notifyDomainAwsPending,
  notifyDomainTransfer,
  notifyDomainFailed,
} from '../../helpers/notification.helper';
import { config } from '../../config/config';

@Processor(VERIFY_DOMAIN_DNS_QUEUE)
export class DnsVerificationQueueProcessor {
  private readonly logger = new Logger(DnsVerificationQueueProcessor.name);

  constructor(
    private readonly domainRepository: DomainRepository,
    @InjectQueue(VERIFY_DOMAIN_DNS_QUEUE) private readonly verifyDnsQueue: Queue,
    @InjectQueue(VERIFY_DOMAIN_AWS_QUEUE) private readonly verifyAwsQueue: Queue,
  ) {
    this.logger.log('DnsVerificationQueueProcessor initialized and ready to process jobs');
  }

  @Process('verify-dns-records')
  async handleVerifyDnsRecords(job: Job<any>) {
    try {
      this.logger.log('Processing verify-dns-records job');
      logInfoMessage(`DnsVerificationQueueProcessor: Processing verify-dns-records - Job ID: ${job.id}, Data: ${JSON.stringify(job.data)}`);

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

          // Notify team about failure
          await notifyDomainFailed(domain.teamId, domain.name, domain.id, 'DNS verification timeout (30 minutes exceeded)');
        }
        return;
      }

      // Get domain from database with DNS records
      const domain = await this.domainRepository.findById(domainId);
      if (!domain) {
        this.logger.error(`Domain not found: ${domainId}`);
        logError(`DnsVerificationQueueProcessor: Domain not found - Domain ID: ${domainId}, Job ID: ${job.id}`);
        return;
      }

      // Only process domains in pending_dns or failed status
      if (domain.status !== DomainStatus.pending_dns && domain.status !== DomainStatus.failed) {
        this.logger.log(`Domain ${domain.name} is not in pending_dns or failed status, skipping`);
        return;
      }

      // Use DNS records from domain
      const dnsRecords = domain.dnsRecords;

      // Verify each DNS record
      const verificationResults = new Map<number, { verified: boolean }>();

      for (const record of dnsRecords) {
        this.logger.log(`Verifying DNS record: ${record.type} - ${record.name}`);

        const result = await verifyDnsRecord(
          record.recordType,
          record.name,
          record.value,
          record.priority
        );

        // Update DNS record if verified
        if (result.verified && record.status !== DomainStatus.dns_verified) {
          await this.domainRepository.updateDnsRecord(record.id, {
            status: DomainStatus.dns_verified,
            lastCheckedAt: new Date(),
          });

          this.logger.log(
            `✓ DNS record ${record.type} for ${domain.name} verified: ${record.status} -> dns_verified`
          );
        } else {
          // Update lastCheckedAt timestamp
          await this.domainRepository.updateDnsRecord(record.id, {
            lastCheckedAt: new Date(),
          });

          if (!result.verified) {
            this.logger.log(`✗ DNS record ${record.type} for ${domain.name} not yet verified`);
          }
        }

        verificationResults.set(record.id, { verified: result.verified });
      }

      // Check if all DNS records are verified
      const allVerified = Array.from(verificationResults.values()).every(r => r.verified);

      if (allVerified) {
        this.logger.log(`All DNS records verified for domain: ${domain.name}`);

        // Remove DNS verification repeatable job (no longer needed)
        await this.verifyDnsQueue.removeRepeatable('verify-dns-records', {
          every: config.domainVerification.dnsVerificationInterval,
          jobId: `dns-verification-${domainId}`,
        });

        // Check if domain exists in AWS SES (another team might own it)
        const domainExistsInAws = await checkDomainExists(domain.name, domain.region);

        if (domainExistsInAws) {
          // Domain exists in AWS - check if it belongs to another team
          const otherTeamDomain = await this.domainRepository.findVerifiedByName(domain.name);

          if (otherTeamDomain && otherTeamDomain.id !== domain.id) {
            this.logger.log(`Domain ${domain.name} is being transferred from team ${otherTeamDomain.teamId} to team ${domain.teamId}`);

            // Notify the previous team about the transfer
            await notifyDomainTransfer(otherTeamDomain.teamId, domain.name, false);

            // Revoke the previous team's domain
            await this.domainRepository.update(otherTeamDomain.id, {
              status: DomainStatus.revoked,
            });

            // Create ownership history record
            await this.domainRepository.createOwnershipHistory({
              domainId: domain.id,
              domainName: domain.name,
              previousTeamId: otherTeamDomain.teamId,
              newTeamId: domain.teamId,
              transferReason: 'dns_verification',
              metadata: {
                previousDomainId: otherTeamDomain.id,
                dkimChanged: true,
              },
            });

            // Delete from AWS (will re-add with new DKIM keys)
            await deleteDomainFromSES(domain.name, domain.region);
          }
        }

        // Register domain with AWS SES using this team's DKIM keys
        await registerDomainWithSES(
          domain.name,
          domain.dkimSelector,
          domain.dkimPrivateKey,
          domain.region
        );

        // Update domain status to pending_aws
        await this.domainRepository.update(domainId, {
          status: DomainStatus.pending_aws,
          awsRegisteredAt: new Date(),
        });

        // Notify team about DNS verification success
        await notifyDomainDnsVerified(domain.teamId, domain.name, domain.id);

        // Notify team about AWS registration
        await notifyDomainAwsPending(domain.teamId, domain.name, domain.id);

        // Notify new team about domain transfer (if applicable)
        if (domainExistsInAws) {
          await notifyDomainTransfer(domain.teamId, domain.name, true);
        }

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
        const verifiedCount = Array.from(verificationResults.values()).filter(r => r.verified).length;
        this.logger.log(`DNS verification in progress for ${domain.name}: ${verifiedCount}/${dnsRecords.length} records verified`);
      }

      const duration = Date.now() - job.timestamp;
      logInfoMessage(`DnsVerificationQueueProcessor: DNS verification completed for domain ${domain.name} - Duration: ${duration}ms`);

    } catch (error) {
      this.logger.error(`Failed to process verify-dns-records: ${error.message}`);
      logError(`DnsVerificationQueueProcessor: Failed to process verify-dns-records - Job ID: ${job.id}, Error: ${error.message}`);
      throw error; // Let Bull handle retries
    }
  }
}
