import { Injectable, HttpStatus } from '@nestjs/common';
import { TeamApiKeyRepository } from '../../repositories/team-api-key.repository';
import { ApiKeysValidator } from './api-keys.validator';
import { CreateApiKeyDto, UpdateApiKeyDto, GetApiKeysDto } from './dto/api-keys.dto';
import { throwError, generateSuccessResponse } from '../../utils/util';
import { handleServiceError } from '../../utils/error.util';

@Injectable()
export class ApiKeysService {
  constructor(
    private readonly teamApiKeyRepository: TeamApiKeyRepository,
    private readonly apiKeysValidator: ApiKeysValidator,
  ) {}

  async getApiKeys(query: GetApiKeysDto, headers: any, user: any) {
    try {
      // Validate and parse team ID from headers
      const teamId = this.validateAndParseTeamId(headers);
      
      // Validate team access and query parameters
      const { validatedData, teamId: validatedTeamId } = await this.apiKeysValidator.validateGetApiKeys(query, teamId, user.id);

      // Set pagination parameters
      const page = validatedData.page || 1;
      const limit = validatedData.limit || 10;

      // Get API keys with pagination
      const apiKeys = await this.teamApiKeyRepository.findByTeamIdWithPagination({
        teamId: validatedTeamId,
        status: validatedData.status,
        keyword: validatedData.search,
        offset: (page - 1) * limit,
        limit: limit
      });
      
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'API keys retrieved successfully',
        data: apiKeys.data,
        meta: apiKeys.meta
      });
    } catch (error) {
      return handleServiceError('Error retrieving API keys', error);
    }
  }

  async createApiKey(createApiKeyDto: CreateApiKeyDto, headers: any, user: any) {
    try {
      // Validate and parse team ID from headers
      const teamId = this.validateAndParseTeamId(headers);
      
      // Validate team access and API key data
      const { validatedData, teamId: validatedTeamId } = await this.apiKeysValidator.validateCreateApiKey(createApiKeyDto, teamId, user.id);

      // Generate API key
      const apiKey = this.generateApiKey();
      
      // Create new API key
      const newApiKey = await this.teamApiKeyRepository.create({
        key: apiKey,
        name: validatedData.name,
        teamId: validatedTeamId,
        permission: validatedData.permission || 'read',
        domain: validatedData.domain,
        createdBy: user.id
      });
      
      return generateSuccessResponse({
        statusCode: HttpStatus.CREATED,
        message: 'API key created successfully',
        data: newApiKey
      });
    } catch (error) {
      return handleServiceError('Error creating API key', error);
    }
  }

  async getApiKey(id: string, headers: any, user: any) {
    try {
      // Validate and parse parameters
      const apiKeyId = this.validateAndParseId(id);
      const teamId = this.validateAndParseTeamId(headers);
      
      // Validate team access and API key ownership
      const { apiKey } = await this.apiKeysValidator.validateGetApiKey(apiKeyId, teamId, user.id);
      
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'API key retrieved successfully',
        data: apiKey
      });
    } catch (error) {
      return handleServiceError('Error retrieving API key', error);
    }
  }

  async updateApiKey(id: string, updateApiKeyDto: UpdateApiKeyDto, headers: any, user: any) {
    try {
      // Validate and parse parameters
      const apiKeyId = this.validateAndParseId(id);
      const teamId = this.validateAndParseTeamId(headers);
      
      // Validate team access and update permissions
      const { apiKeyId: validatedApiKeyId, validatedData } = await this.apiKeysValidator.validateUpdateApiKey(apiKeyId, updateApiKeyDto, teamId, user.id);

      // Update API key
      const updatedApiKey = await this.teamApiKeyRepository.update(validatedApiKeyId, validatedData);
      
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'API key updated successfully',
        data: updatedApiKey
      });
    } catch (error) {
      return handleServiceError('Error updating API key', error);
    }
  }

  async deleteApiKey(id: string, headers: any, user: any) {
    try {
      // Validate and parse parameters
      const apiKeyId = this.validateAndParseId(id);
      const teamId = this.validateAndParseTeamId(headers);
      
      // Validate team access and deletion permissions
      const { apiKeyId: validatedApiKeyId, apiKey } = await this.apiKeysValidator.validateDeleteApiKey(apiKeyId, teamId, user.id);

      // Delete API key
      await this.teamApiKeyRepository.delete(validatedApiKeyId);
      
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: 'API key deleted successfully',
        data: { id: apiKey.id }
      });
    } catch (error) {
      return handleServiceError('Error deleting API key', error);
    }
  }

  // UTILITY METHODS
  private validateAndParseTeamId(headers: any): number {
    const teamId = headers['x-team-id'];
    if (!teamId) {
      throwError('Team ID is required', HttpStatus.BAD_REQUEST, 'teamIdRequired');
    }
    
    const parsedTeamId = parseInt(teamId);
    if (isNaN(parsedTeamId) || parsedTeamId <= 0) {
      throwError('Invalid team ID', HttpStatus.BAD_REQUEST, 'invalidTeamId');
    }
    
    return parsedTeamId;
  }

  private validateAndParseId(id: string): number {
    const parsedId = parseInt(id);
    if (isNaN(parsedId) || parsedId <= 0) {
      throwError('Invalid ID', HttpStatus.BAD_REQUEST, 'invalidId');
    }
    
    return parsedId;
  }

  private generateApiKey(): string {
    const crypto = require('crypto');
    return `ak_${crypto.randomBytes(32).toString('hex')}`;
  }
}
