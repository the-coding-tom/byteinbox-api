import { Injectable } from '@nestjs/common';
import { DomainStatus } from '@prisma/client';
import { DomainsValidator } from './domains.validator';
import { DomainRepository } from '../../repositories/domain.repository';
import { generateSuccessResponse } from '../../utils/util';
import { handleServiceError } from '../../utils/error.util';
import { Constants } from '../../common/enums/generic.enum';
import { config } from '../../config/config';
import {
  registerDomainWithSES,
  generateDnsRecords,
  deleteDomainFromSES,
} from '../../helpers/aws-ses.helper';
import { 
  AddDomainDto, 
  AddDomainResponseDto, 
  GetDomainsResponseDto, 
  GetDomainDetailsResponseDto, 
  UpdateDomainConfigurationDto,
  UpdateDomainConfigurationResponseDto,
  VerifyDomainResponseDto, 
  RestartDomainResponseDto
} from './dto/domains.dto';

@Injectable()
export class DomainsService {
  constructor(
    private readonly domainsValidator: DomainsValidator,
    private readonly domainRepository: DomainRepository,
  ) {}

  async addDomain(userId: number, teamId: number, addDomainDto: AddDomainDto): Promise<any> {
    try {
      // Validate input data
      await this.domainsValidator.validateAddDomain(addDomainDto);

      // Get static DKIM keys from config (environment variables)
      const publicKeyBase64 = config.aws.ses.dkimPublicKey;
      const privateKeyBase64 = config.aws.ses.dkimPrivateKey;
      const selector = config.aws.ses.dkimSelector;

      // Register domain with AWS SES (includes custom MAIL FROM domain setup)
      await registerDomainWithSES(
        addDomainDto.domainName,
        selector,
        privateKeyBase64,
        addDomainDto.region
      );

      // Generate DNS records (DKIM, SPF, MX, DMARC)
      const dnsRecords = generateDnsRecords(
        addDomainDto.domainName,
        selector,
        publicKeyBase64,
        addDomainDto.region
      );

      // Create domain in database
      const domain = await this.domainRepository.createDomain({
        name: addDomainDto.domainName,
        createdBy: userId,
        teamId,
        status: DomainStatus.pending,
        region: addDomainDto.region,
        clickTracking: true,
        openTracking: true,
        tlsMode: 'enforced',
      });

      // Create DNS records in database
      await this.domainRepository.createDnsRecords(domain.id, dnsRecords);

      // Fetch created DNS records
      const createdDnsRecords = await this.domainRepository.findDnsRecordsByDomainId(domain.id);

      const response: AddDomainResponseDto = {
        domain: {
          id: domain.id.toString(),
          domainName: domain.name,
          region: domain.region,
          status: domain.status,
          createdAt: domain.createdAt.toISOString(),
          dnsRecords: createdDnsRecords.map(record => ({
            type: record.type,
            name: record.name,
            value: record.value,
            status: record.status,
            priority: record.priority,
          })),
        },
      };

      return generateSuccessResponse({
        statusCode: 201,
        message: 'Domain created successfully. Please add the DNS records to your domain provider.',
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
        offset: validatedData.filter.offset || config.validation.pagination.defaultPage,
        limit: validatedData.filter.limit || config.validation.pagination.defaultLimit,
      });

      const response: GetDomainsResponseDto = {
        domains: teamDomains.map(domain => ({
          id: domain.id.toString(),
          name: domain.name,
          status: domain.status,
          createdAt: new Date(domain.createdAt).toISOString(),
          updatedAt: new Date(domain.updatedAt).toISOString(),
        })),
        meta: {
          total,
          offset: validatedData.filter.offset || config.validation.pagination.defaultPage,
          limit: validatedData.filter.limit || config.validation.pagination.defaultLimit,
        },
      };

      return generateSuccessResponse({
        statusCode: 200,
        message: Constants.retrievedSuccessfully,
        data: response,
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

      const response: GetDomainDetailsResponseDto = {
        domain: {
          id: domainWithRecords!.id.toString(),
          name: domainWithRecords!.name,
          status: domainWithRecords!.status,
          region: domainWithRecords!.region,
          clickTracking: domainWithRecords!.clickTracking,
          openTracking: domainWithRecords!.openTracking,
          tlsMode: domainWithRecords!.tlsMode,
          createdAt: domainWithRecords!.createdAt.toISOString(),
          updatedAt: domainWithRecords!.updatedAt.toISOString(),
          dnsRecords: domainWithRecords!.dnsRecords.map(record => ({
            id: record.id.toString(),
            type: record.type,
            name: record.name,
            recordType: record.recordType,
            value: record.value,
            status: record.status,
            ...(record.priority && { priority: record.priority }),
          })),
        },
      };

      return generateSuccessResponse({
        statusCode: 200,
        message: Constants.retrievedSuccessfully,
        data: response,
      });
    } catch (error) {
      return handleServiceError('Error retrieving domain details', error);
    }
  }


  async verifyDomain(domainId: string, teamId: number): Promise<any> {
    try {
      // Validate input data
      const { validatedData } = await this.domainsValidator.validateVerifyDomain(domainId, teamId);

      // Find domain (already validated in validator)
      const domain = await this.domainRepository.findById(validatedData.domainId);

      // Get DNS records from database (verification status is updated by cron job)
      const dnsRecords = await this.domainRepository.findDnsRecordsByDomainId(domain.id);

      // Calculate verification status based on DNS records
      const allVerified = dnsRecords.every(record => record.status === DomainStatus.verified);
      const anyFailed = dnsRecords.some(record => record.status === DomainStatus.failed);

      let message = '';
      if (allVerified && domain.status === DomainStatus.verified) {
        message = 'Domain verification completed successfully';
      } else if (anyFailed) {
        message = 'Domain verification failed. Please check your DNS records and try again.';
      } else {
        message = 'Domain verification is still pending. Please ensure DNS records are properly configured. Verification checks run every 5 minutes.';
      }

      const response: VerifyDomainResponseDto = {
        message,
        domain: {
          id: domain.id.toString(),
          name: domain.name,
          status: domain.status,
          verifiedAt: domain.status === DomainStatus.verified ? domain.updatedAt.toISOString() : '',
        },
      };

      return generateSuccessResponse({
        statusCode: 200,
        message: response.message,
        data: response,
      });
    } catch (error) {
      return handleServiceError('Error verifying domain', error);
    }
  }

  async deleteDomain(domainId: string, teamId: number): Promise<any> {
    try {
      // Validate input data
      const { validatedData } = await this.domainsValidator.validateDeleteDomain(domainId, teamId);

      // Find domain (already validated in validator)
      const domain = await this.domainRepository.findById(validatedData.domainId);

      // Delete domain from AWS SES
      await deleteDomainFromSES(domain.name, domain.region || 'us-east-1');

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

  async updateDomainConfiguration(domainId: string, teamId: number, updateDomainConfigurationDto: UpdateDomainConfigurationDto): Promise<any> {
    try {
      // Validate input data
      const { validatedData } = await this.domainsValidator.validateUpdateDomainConfiguration(domainId, teamId, updateDomainConfigurationDto);

      // Update domain configuration in database
      const updatedDomain = await this.domainRepository.update(validatedData.domainId, {
        clickTracking: validatedData.validatedData.clickTracking,
        openTracking: validatedData.validatedData.openTracking,
        tlsMode: validatedData.validatedData.tlsMode,
      });

      const response: UpdateDomainConfigurationResponseDto = {
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
      // Validate input data
      const { validatedData } = await this.domainsValidator.validateRestartDomain(domainId, teamId);

      // Dummy response - in real implementation, this would restart the domain
      const response: RestartDomainResponseDto = {
        message: Constants.successMessage,
        domain: {
          id: validatedData.domainId.toString(),
          name: 'example.com',
          status: 'active',
          restartedAt: new Date().toISOString(),
        },
      };

      return generateSuccessResponse({
        statusCode: 200,
        message: Constants.successMessage,
        data: response,
      });
    } catch (error) {
      return handleServiceError('Error restarting domain', error);
    }
  }
}
