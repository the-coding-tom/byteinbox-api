import { Injectable } from '@nestjs/common';
import { DomainStatus } from '@prisma/client';
import { DomainsValidator } from './domains.validator';
import { DomainRepository } from '../../repositories/domain.repository';
import { TeamRepository } from '../../repositories/team.repository';
import { generateSuccessResponse } from '../../utils/util';
import { handleServiceError } from '../../utils/error.util';
import { Constants } from '../../common/enums/generic.enum';
import {
  generateDkimKeyPair,
  registerDomainWithSES,
  generateDnsRecords,
  getDomainVerificationStatus,
  deleteDomainFromSES,
  generateDkimSelector,
  isValidDomainName,
} from '../../helpers/aws-ses.helper';
import { 
  CreateDomainDto, 
  CreateDomainResponseDto, 
  GetDomainsResponseDto, 
  GetDomainDetailsResponseDto, 
  UpdateDomainDto, 
  UpdateDomainResponseDto, 
  VerifyDomainResponseDto, 
  DeleteDomainResponseDto,
  GetRegionsResponseDto,
  UpdateDomainConfigurationDto,
  UpdateDomainConfigurationResponseDto,
  RestartDomainResponseDto
} from './dto/domains.dto';

@Injectable()
export class DomainsService {
  constructor(
    private readonly domainsValidator: DomainsValidator,
    private readonly domainRepository: DomainRepository,
    private readonly teamRepository: TeamRepository,
  ) {}

  async createDomain(userId: number, createDomainDto: CreateDomainDto, request: any): Promise<any> {
    try {
      // Validate input data
      await this.domainsValidator.validateCreateDomain(createDomainDto);

      // Validate domain name format
      if (!isValidDomainName(createDomainDto.name)) {
        throw new Error('Invalid domain name format');
      }

      // Check if domain already exists
      const existingDomain = await this.domainRepository.findByName(createDomainDto.name);
      if (existingDomain) {
        throw new Error('Domain already exists');
      }

      // Get user's team (use provided teamId or get user's personal team)
      let teamId: number;
      if (createDomainDto.teamId) {
        teamId = parseInt(createDomainDto.teamId);
        // Verify user has access to this team
        const team = await this.teamRepository.findById(teamId);
        if (!team) {
          throw new Error('Team not found');
        }
        // TODO: Verify user is a member of this team
      } else {
        // Get user's personal team
        const userTeams = await this.teamRepository.findUserTeams(userId);
        if (!userTeams || userTeams.length === 0) {
          throw new Error('No team found for user');
        }
        teamId = userTeams[0].id; // Use first team (personal team)
      }

      // Generate DKIM key pair
      const dkimKeys = await generateDkimKeyPair();
      
      // Generate unique DKIM selector
      const selector = generateDkimSelector(createDomainDto.name);

      // Default region (can be made configurable)
      const region = process.env.AWS_REGION || 'us-east-1';

      // Register domain with AWS SES
      await registerDomainWithSES(
        createDomainDto.name,
        selector,
        dkimKeys.privateKeyBase64,
        region
      );

      // Generate DNS records
      const dnsRecords = generateDnsRecords(
        createDomainDto.name,
        selector,
        dkimKeys.publicKeyBase64,
        region
      );

      // Create domain in database
      const domain = await this.domainRepository.createDomain({
        name: createDomainDto.name,
        createdBy: userId,
        teamId,
        status: DomainStatus.pending,
        region,
        clickTracking: true,
        openTracking: true,
        tlsMode: 'enforced',
      });

      // Create DNS records in database
      await this.domainRepository.createDnsRecords(domain.id, dnsRecords);

      // Fetch created DNS records
      const createdDnsRecords = await this.domainRepository.findDnsRecordsByDomainId(domain.id);

      // TODO: Store DKIM keys securely (encrypted in database or secure storage)
      // For now, we're not storing them in the response for security

      const response: CreateDomainResponseDto = {
        domain: {
          id: domain.id.toString(),
          name: domain.name,
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
      return handleServiceError(error, 'Error creating domain');
    }
  }

  async getDomains(userId: number): Promise<any> {
    try {
      // Get user's teams
      const userTeams = await this.teamRepository.findUserTeams(userId);
      if (!userTeams || userTeams.length === 0) {
        throw new Error('No team found for user');
      }

      // Get domains for all user's teams
      const allDomains = [];
      for (const team of userTeams) {
        const teamDomains = await this.domainRepository.findByTeamId(team.id);
        allDomains.push(...teamDomains);
      }

      const response: GetDomainsResponseDto = {
        domains: allDomains.map(domain => ({
          id: domain.id.toString(),
          name: domain.name,
          status: domain.status,
          createdAt: domain.createdAt.toISOString(),
          updatedAt: domain.updatedAt.toISOString(),
        })),
      };

      return generateSuccessResponse({
        statusCode: 200,
        message: Constants.retrievedSuccessfully,
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'Error retrieving domains');
    }
  }

  async getDomainDetails(domainId: string, userId: number): Promise<any> {
    try {
      // Dummy response - in real implementation, this would fetch domain details with DNS records
      const response: GetDomainDetailsResponseDto = {
        domain: {
          id: domainId,
          name: 'example.com',
          status: 'verified',
          region: 'us-east-1',
          clickTracking: true,
          openTracking: true,
          tlsMode: 'enforced',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
          dnsRecords: [
            {
              id: 'dns_123',
              type: 'spf',
              name: 'example.com',
              recordType: 'TXT',
              value: 'v=spf1 include:byteinbox.com ~all',
              status: 'verified',
            },
            {
              id: 'dns_456',
              type: 'dkim',
              name: 'byteinbox._domainkey.example.com',
              recordType: 'TXT',
              value: 'v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...',
              status: 'verified',
            },
            {
              id: 'dns_789',
              type: 'dmarc',
              name: '_dmarc.example.com',
              recordType: 'TXT',
              value: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com',
              status: 'verified',
            },
          ],
        },
      };

      return generateSuccessResponse({
        statusCode: 200,
        message: Constants.retrievedSuccessfully,
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'Error retrieving domain details');
    }
  }

  async updateDomain(domainId: string, userId: number, updateDomainDto: UpdateDomainDto, request: any): Promise<any> {
    try {
      // Validate input data
      await this.domainsValidator.validateUpdateDomain(updateDomainDto);

      // Dummy response - in real implementation, this would update the domain
      const response: UpdateDomainResponseDto = {
        domain: {
          id: domainId,
          name: updateDomainDto.name || 'example.com',
          status: 'verified',
          region: updateDomainDto.region || 'us-east-1',
          clickTracking: updateDomainDto.clickTracking ?? true,
          openTracking: updateDomainDto.openTracking ?? true,
          tlsMode: updateDomainDto.tlsMode || 'enforced',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: new Date().toISOString(),
        },
      };

      return generateSuccessResponse({
        statusCode: 200,
        message: Constants.updatedSuccessfully,
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'Error updating domain');
    }
  }

  async verifyDomain(domainId: string, userId: number, request: any): Promise<any> {
    try {
      // Find domain
      const domain = await this.domainRepository.findById(parseInt(domainId));
      if (!domain) {
        throw new Error('Domain not found');
      }

      // TODO: Verify user has access to this domain's team

      // Get verification status from AWS SES
      const verificationStatus = await getDomainVerificationStatus(
        domain.name,
        domain.region || 'us-east-1'
      );

      // Update domain status based on AWS SES verification
      let newStatus: DomainStatus = DomainStatus.pending;
      if (verificationStatus.verified && verificationStatus.dkimStatus === 'SUCCESS') {
        newStatus = DomainStatus.verified;
        
        // Update all DNS records as verified
        await this.domainRepository.updateDomainDnsRecordsStatus(
          domain.id,
          DomainStatus.verified
        );
      } else if (verificationStatus.dkimStatus === 'FAILED') {
        newStatus = DomainStatus.failed;
      }

      // Update domain status
      const updatedDomain = await this.domainRepository.update(domain.id, {
        status: newStatus,
      });

      const response: VerifyDomainResponseDto = {
        message: newStatus === DomainStatus.verified
          ? 'Domain verification completed successfully' 
          : 'Domain verification is still pending. Please ensure DNS records are properly configured.',
        domain: {
          id: updatedDomain.id.toString(),
          name: updatedDomain.name,
          status: updatedDomain.status,
          verifiedAt: newStatus === DomainStatus.verified ? new Date().toISOString() : '',
        },
      };

      return generateSuccessResponse({
        statusCode: 200,
        message: response.message,
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'Error verifying domain');
    }
  }

  async deleteDomain(domainId: string, userId: number, request: any): Promise<any> {
    try {
      // Find domain
      const domain = await this.domainRepository.findById(parseInt(domainId));
      if (!domain) {
        throw new Error('Domain not found');
      }

      // TODO: Verify user has access to this domain's team

      // Delete domain from AWS SES
      await deleteDomainFromSES(domain.name, domain.region || 'us-east-1');

      // Delete domain from database (will cascade delete DNS records)
      await this.domainRepository.delete(domain.id);

      const response: DeleteDomainResponseDto = {
        message: Constants.deletedSuccessfully,
      };

      return generateSuccessResponse({
        statusCode: 200,
        message: Constants.deletedSuccessfully,
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'Error deleting domain');
    }
  }

  async getRegions(): Promise<any> {
    try {
      // Dummy response - in real implementation, this would fetch available regions
      const response: GetRegionsResponseDto = {
        regions: [
          {
            id: 'us-east-1',
            name: 'US East (N. Virginia)',
            location: 'Virginia, USA',
            available: true,
          },
          {
            id: 'us-west-2',
            name: 'US West (Oregon)',
            location: 'Oregon, USA',
            available: true,
          },
          {
            id: 'eu-west-1',
            name: 'Europe (Ireland)',
            location: 'Ireland',
            available: true,
          },
          {
            id: 'ap-southeast-1',
            name: 'Asia Pacific (Singapore)',
            location: 'Singapore',
            available: true,
          },
        ],
      };

      return generateSuccessResponse({
        statusCode: 200,
        message: Constants.retrievedSuccessfully,
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'Error retrieving regions');
    }
  }

  async updateDomainConfiguration(domainId: string, userId: number, updateDomainConfigurationDto: UpdateDomainConfigurationDto, request: any): Promise<any> {
    try {
      // Validate input data
      await this.domainsValidator.validateUpdateDomainConfiguration(updateDomainConfigurationDto);

      // Dummy response - in real implementation, this would update domain configuration
      const response: UpdateDomainConfigurationResponseDto = {
        domain: {
          id: domainId,
          name: 'example.com',
          clickTracking: updateDomainConfigurationDto.clickTracking ?? true,
          openTracking: updateDomainConfigurationDto.openTracking ?? true,
          tlsMode: updateDomainConfigurationDto.tlsMode || 'enforced',
          updatedAt: new Date().toISOString(),
        },
      };

      return generateSuccessResponse({
        statusCode: 200,
        message: Constants.updatedSuccessfully,
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'Error updating domain configuration');
    }
  }

  async restartDomain(domainId: string, userId: number, request: any): Promise<any> {
    try {
      // Dummy response - in real implementation, this would restart the domain
      const response: RestartDomainResponseDto = {
        message: Constants.successMessage,
        domain: {
          id: domainId,
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
      return handleServiceError(error, 'Error restarting domain');
    }
  }
}
