import { Injectable, HttpStatus } from '@nestjs/common';
import { ApiKeyRepository } from '../../repositories/api-key.repository';
import { ApiKeysValidator } from './api-keys.validator';
import { CreateApiKeyDto, UpdateApiKeyDto, GetApiKeysDto } from './dto/api-keys.dto';
import { generateSuccessResponse, transformToPaginationMeta } from '../../utils/util';
import { handleServiceError } from '../../utils/error.util';
import { Constants } from '../../common/enums/generic.enum';
import { generateApiKey } from '../../utils/crypto.util';
import { config } from '../../config/config';

@Injectable()
export class ApiKeysService {
  constructor(
    private readonly apiKeyRepository: ApiKeyRepository,
    private readonly apiKeysValidator: ApiKeysValidator,
  ) { }

  async getApiKeys(query: GetApiKeysDto, teamId: number) {
    try {
      // Validate request
      const validatedData = await this.apiKeysValidator.validateGetApiKeysRequest(query);

      // Set pagination parameters
      const page = validatedData.page || config.validation.pagination.defaultPage;
      const limit = validatedData.limit || config.validation.pagination.defaultLimit;

      // Get API keys with pagination
      const result = await this.apiKeyRepository.findByTeamIdWithPagination({
        teamId,
        status: validatedData.status,
        keyword: validatedData.search,
        offset: (page - 1) * limit,
        limit: limit
      });

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
        data: result.data,
        meta: transformToPaginationMeta({ limit: result.limit, offset: result.offset, total: result.total }),
      });
    } catch (error) {
      return handleServiceError('Error retrieving API keys', error);
    }
  }

  async createApiKey(createApiKeyDto: CreateApiKeyDto, teamId: number, user: any) {
    try {
      // Validate request
      const validatedData = await this.apiKeysValidator.validateCreateApiKeyRequest(createApiKeyDto, teamId);

        // Generate API key
        const apiKey = generateApiKey();

      // Create new API key
      const newApiKey = await this.apiKeyRepository.create({
        key: apiKey,
        name: validatedData.name,
        teamId,
        permission: validatedData.permission || 'read',
        domain: validatedData.domain,
        createdBy: user.id
      });

      return generateSuccessResponse({
        statusCode: HttpStatus.CREATED,
        message: Constants.createdSuccessfully,
        data: newApiKey
      });
    } catch (error) {
      return handleServiceError('Error creating API key', error);
    }
  }

  async getApiKey(id: string, teamId: number) {
    try {
      // Validate request
      const { apiKey } = await this.apiKeysValidator.validateGetApiKeyRequest(id, teamId);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.retrievedSuccessfully,
        data: apiKey
      });
    } catch (error) {
      return handleServiceError('Error retrieving API key', error);
    }
  }

  async updateApiKey(id: string, updateApiKeyDto: UpdateApiKeyDto, teamId: number) {
    try {
      // Validate request
      const { apiKeyId, validatedData } = await this.apiKeysValidator.validateUpdateApiKeyRequest(id, updateApiKeyDto, teamId);

      // Update API key
      const updatedApiKey = await this.apiKeyRepository.update(apiKeyId, validatedData);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.updatedSuccessfully,
        data: updatedApiKey
      });
    } catch (error) {
      return handleServiceError('Error updating API key', error);
    }
  }

  async deleteApiKey(id: string, teamId: number) {
    try {
      // Validate request
      const { apiKeyId } = await this.apiKeysValidator.validateDeleteApiKeyRequest(id, teamId);

      // Delete API key
      await this.apiKeyRepository.delete(apiKeyId);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.deletedSuccessfully,
        data: { id: apiKeyId }
      });
    } catch (error) {
      return handleServiceError('Error deleting API key', error);
    }
  }
}
