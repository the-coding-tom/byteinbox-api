import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { DomainStatus } from '@prisma/client';
import { DomainsValidator } from './domains.validator';
import { DomainRepository } from '../../repositories/domain.repository';
import { generateSuccessResponse } from '../../utils/util';
import { handleServiceError } from '../../utils/error.util';
import { Constants, WebhookEventType } from '../../common/enums/generic.enum';
import { config } from '../../config/config';
import { VERIFY_DOMAIN_DNS_QUEUE } from '../../common/constants/queues.constant';
import {
  generateDnsRecords,
  deleteDomainFromSES,
} from '../../helpers/aws-ses.helper';
import { generateDkimKeyPair } from '../../utils/dkim.util';
import {
  AddDomainDto,
  UpdateDomainSettingsDto,
} from './dto/domains.dto';
import { WebhookPublisherService } from '../../shared-services/webhook-publisher/webhook-publisher.service';

@Injectable()
export class DomainsService {
  constructor(
    private readonly domainsValidator: DomainsValidator,
    private readonly domainRepository: DomainRepository,
    @InjectQueue(VERIFY_DOMAIN_DNS_QUEUE) private readonly verifyDnsQueue: Queue,
    private readonly webhookPublisher: WebhookPublisherService,
  ) { }

  async addDomain(userId: number, teamId: number, addDomainDto: AddDomainDto): Promise<any> {
    try {
      // Validate input data (this already checks for duplicates and handles conflicts)
      const { validatedData } = await this.domainsValidator.validateAddDomain(addDomainDto, teamId);

      // Generate unique DKIM key pair
      const dkimKeys = generateDkimKeyPair();

      // Generate DNS records using domain-specific public key
      // NOTE: We do NOT register with AWS SES yet - only after DNS verification
      const dnsRecords = generateDnsRecords(
        validatedData.name,
        dkimKeys.selector,
        dkimKeys.publicKey,
        validatedData.region
      );

      // Create domain and DNS records in a single atomic transaction
      // Status: not_started (waiting for user to call verify API)
      const domain = await this.domainRepository.createDomainWithDnsRecords({
        name: validatedData.name,
        createdBy: userId,
        teamId,
        status: DomainStatus.not_started,
        region: validatedData.region,
        clickTracking: true,
        openTracking: true,
        tlsMode: config.domainVerification.defaultTlsMode,
        dkimSelector: dkimKeys.selector,
        dkimPublicKey: dkimKeys.publicKey,
        dkimPrivateKey: dkimKeys.privateKey,
      }, dnsRecords);


      // Publish webhook event for domain creation
      await this.webhookPublisher.publishEvent(
        teamId,
        WebhookEventType.domainCreated,
        {
          id: domain.id,
          name: domain.name,
          status: domain.status,
          region: domain.region,
          createdAt: domain.createdAt,
        },
      );

      return generateSuccessResponse({
        statusCode: HttpStatus.CREATED,
        message: Constants.createdSuccessfully,
        data: {
          id: domain.id,
          name: domain.name,
          created_at: domain.createdAt,
          status: domain.status,
          records: domain.records,
          region: domain.region,
        },
      });
    } catch (error) {
      return handleServiceError('Error creating domain', error);
    }
  }

  async getDomains(teamId: number, filter?: any): Promise<any> {
    try {
      // Validate input data
      const { validatedData } = await this.domainsValidator.validateGetDomains(teamId, filter);

      // Get domains with filtering
      const { data: teamDomains, total } = await this.domainRepository.findWithFilter({
        teamId: validatedData.teamId,
        keyword: validatedData.filter.keyword,
        status: validatedData.filter.status,
        region: validatedData.filter.region,
        offset: validatedData.filter.offset || (config.validation.pagination.defaultPage - 1),
        limit: validatedData.filter.limit || config.validation.pagination.defaultLimit,
      });

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
        data: teamDomains,
        meta: {
          total,
          offset: validatedData.filter.offset,
          limit: validatedData.filter.limit,
        },
      });
    } catch (error) {
      return handleServiceError('Error retrieving domains', error);
    }
  }

  async getDomainDetails(domainId: string, teamId: number): Promise<any> {
    try {
      // Validate input data
      const { validatedData } = await this.domainsValidator.validateGetDomainDetails(domainId, teamId);

      // Get domain with DNS records in a single optimized query
      const domainWithRecords = await this.domainRepository.findDomainWithDnsRecords(validatedData.domainId);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
        data: domainWithRecords,
      });
    } catch (error) {
      return handleServiceError('Error retrieving domain details', error);
    }
  }

  async deleteDomain(domainId: string, teamId: number): Promise<any> {
    try {
      // Validate input data
      const { domainId: validatedDomainId, domain } = await this.domainsValidator.validateDeleteDomain(domainId, teamId);
      
      // Delete domain from database (will cascade delete DNS records)
      await this.domainRepository.delete(validatedDomainId);

      // Delete domain from AWS SES only if it was registered
      // (domains in not_started or failed state may not be in AWS yet)
      if (domain.awsRegisteredAt || domain.status === DomainStatus.verifying_aws_setup || domain.status === DomainStatus.verified) {
        await deleteDomainFromSES(domain.name, domain.region);
      }

      // Publish webhook event for domain deletion
      await this.webhookPublisher.publishEvent(
        teamId,
        WebhookEventType.domainDeleted,
        {
          id: domain.reference,
          name: domain.name,
        },
      );

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.deletedSuccessfully,
        data: {
          id: domain.reference,
        },
      });
    } catch (error) {
      return handleServiceError('Error deleting domain', error);
    }
  }

  async updateDomainSettings(domainId: string, teamId: number, updateDomainSettingsDto: UpdateDomainSettingsDto): Promise<any> {
    try {
      // Validate input data
      const { domainId: validatedDomainId, updateData } = await this.domainsValidator.validateUpdateDomainSettings(domainId, teamId, updateDomainSettingsDto);

      // Update domain configuration in database
      const updatedDomain = await this.domainRepository.update(validatedDomainId, updateData);

      // Publish webhook event for domain update
      await this.webhookPublisher.publishEvent(
        teamId,
        WebhookEventType.domainUpdated,
        {
          id: updatedDomain.reference,
          ...updateData,
        },
      );

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.updatedSuccessfully,
        data: {
          id: updatedDomain.reference,
        },
      });
    } catch (error) {
      return handleServiceError('Error updating domain configuration', error);
    }
  }

  async verifyDomain(domainId: string, teamId: number): Promise<any> {
    try {
      // Validate input data (domain is fetched and returned in validatedData)
      const { validatedData } = await this.domainsValidator.validateVerifyDomain(domainId, teamId);
      const domain = validatedData.domain;

      // Update domain status to verifying_dns
      await this.domainRepository.update(domain.id, {
        status: DomainStatus.verifying_dns,
      });

      // Enqueue for DNS verification with fresh TTL (jobId ensures only one repeatable job exists)
      await this.verifyDnsQueue.add(
        'verify-dns-records',
        {
          domainId: domain.id,
          ttl: Date.now() + config.domainVerification.ttl,
        },
        {
          jobId: `dns-verification-${domain.id}`,
          repeat: {
            every: config.domainVerification.dnsVerificationInterval,
          },
        }
      );

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.updatedSuccessfully,
        data: {
          id: domain.reference,
        },
      });
    } catch (error) {
      return handleServiceError('Error verifying domain', error);
    }
  }
}
