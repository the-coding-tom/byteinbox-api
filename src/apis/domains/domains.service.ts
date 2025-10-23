import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { DomainStatus } from '@prisma/client';
import { DomainsValidator } from './domains.validator';
import { DomainRepository } from '../../repositories/domain.repository';
import { generateSuccessResponse } from '../../utils/util';
import { handleServiceError } from '../../utils/error.util';
import { Constants } from '../../common/enums/generic.enum';
import { config } from '../../config/config';
import { VERIFY_DOMAIN_DNS_QUEUE } from '../../common/constants/queues.constant';
import {
  generateDnsRecords,
  deleteDomainFromSES,
} from '../../helpers/aws-ses.helper';
import { generateDkimKeyPair } from '../../utils/dkim.util';
import {
  AddDomainDto,
  AddDomainResponseDto,
  UpdateDomainSettingsDto,
  UpdateDomainSettingsResponseDto,
  RestartDomainResponseDto
} from './dto/domains.dto';

@Injectable()
export class DomainsService {
  constructor(
    private readonly domainsValidator: DomainsValidator,
    private readonly domainRepository: DomainRepository,
    @InjectQueue(VERIFY_DOMAIN_DNS_QUEUE) private readonly verifyDnsQueue: Queue,
  ) { }

  async addDomain(userId: number, teamId: number, addDomainDto: AddDomainDto): Promise<any> {
    try {
      // Validate input data (this already checks for duplicates and handles conflicts)
      await this.domainsValidator.validateAddDomain(addDomainDto, teamId);

      // Generate unique DKIM key pair
      const dkimKeys = generateDkimKeyPair();

      // Generate DNS records using domain-specific public key
      // NOTE: We do NOT register with AWS SES yet - only after DNS verification
      const dnsRecords = generateDnsRecords(
        addDomainDto.domainName,
        dkimKeys.selector,
        dkimKeys.publicKey,
        addDomainDto.region
      );

      // Create domain and DNS records in a single atomic transaction
      // Status: pending_dns (waiting for user to add DNS records)
      const domain = await this.domainRepository.createDomainWithDnsRecords({
        name: addDomainDto.domainName,
        createdBy: userId,
        teamId,
        status: DomainStatus.pending_dns,
        region: addDomainDto.region,
        clickTracking: true,
        openTracking: true,
        tlsMode: 'enforced',
        dkimSelector: dkimKeys.selector,
        dkimPublicKey: dkimKeys.publicKey,
        dkimPrivateKey: dkimKeys.privateKey,
      }, dnsRecords);

      // Immediately enqueue for DNS verification with TTL
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

      const response: AddDomainResponseDto = {
        id: domain.id.toString(),
        domainName: domain.name,
        region: domain.region,
        status: domain.status,
        createdAt: domain.createdAt.toISOString(),
        dnsRecords: domain.dnsRecords.map((record: any) => ({
          type: record.type,
          name: record.name,
          value: record.value,
          status: record.status,
          priority: record.priority,
        })),
      };

      return generateSuccessResponse({
        statusCode: 201,
        message: 'Domain created successfully. Please add the DNS records to your domain provider. We will verify them automatically.',
        data: response,
      });
    } catch (error) {
      return handleServiceError('Error creating domain', error);
    }
  }

  async getDomains(teamId: number, filter?: any): Promise<any> {
    try {
      // Validate input data
      const { validatedData } = await this.domainsValidator.validateGetDomains(teamId, filter || {});

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
      // Validate input data (domain is fetched and returned in validatedData)
      const { validatedData } = await this.domainsValidator.validateDeleteDomain(domainId, teamId);
      const { domain } = validatedData;

      // Delete domain from AWS SES only if it was registered
      // (domains in pending_dns or failed state may not be in AWS yet)
      if (domain.awsRegisteredAt || domain.status === DomainStatus.pending_aws || domain.status === DomainStatus.verified) {
        await deleteDomainFromSES(domain.name, domain.region);
      }

      // Delete domain from database (will cascade delete DNS records)
      await this.domainRepository.delete(domain.id);

      return generateSuccessResponse({
        statusCode: 200,
        message: Constants.deletedSuccessfully,
      });
    } catch (error) {
      return handleServiceError('Error deleting domain', error);
    }
  }

  async updateDomainSettings(domainId: string, teamId: number, updateDomainSettingsDto: UpdateDomainSettingsDto): Promise<any> {
    try {
      // Validate input data
      const { validatedData } = await this.domainsValidator.validateUpdateDomainSettings(domainId, teamId, updateDomainSettingsDto);

      // Update domain configuration in database
      const updatedDomain = await this.domainRepository.update(validatedData.domainId, {
        clickTracking: validatedData.validatedData.clickTracking,
        openTracking: validatedData.validatedData.openTracking,
        tlsMode: validatedData.validatedData.tlsMode,
      });

      const response: UpdateDomainSettingsResponseDto = {
        domain: {
          id: updatedDomain.id.toString(),
          name: updatedDomain.name,
          clickTracking: updatedDomain.clickTracking,
          openTracking: updatedDomain.openTracking,
          tlsMode: updatedDomain.tlsMode,
          updatedAt: updatedDomain.updatedAt.toISOString(),
        },
      };

      return generateSuccessResponse({
        statusCode: 200,
        message: Constants.updatedSuccessfully,
        data: response,
      });
    } catch (error) {
      return handleServiceError('Error updating domain configuration', error);
    }
  }

  async restartDomain(domainId: string, teamId: number): Promise<any> {
    try {
      // Validate input data (domain is fetched and returned in validatedData)
      const { validatedData } = await this.domainsValidator.validateRestartDomain(domainId, teamId);
      const domain = validatedData.domain;

      // Re-enqueue for DNS verification based on current status
      if (domain.status === DomainStatus.pending_dns || domain.status === DomainStatus.failed) {
        // Restart DNS verification with fresh TTL (jobId ensures only one repeatable job exists)
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
      }

      const response: RestartDomainResponseDto = {
        message: 'Domain verification restarted successfully',
        domain: {
          id: domain.id.toString(),
          name: domain.name,
          status: domain.status,
          restartedAt: new Date().toISOString(),
        },
      };

      return generateSuccessResponse({
        statusCode: 200,
        message: 'Domain verification restarted successfully',
        data: response,
      });
    } catch (error) {
      return handleServiceError('Error restarting domain verification', error);
    }
  }
}
