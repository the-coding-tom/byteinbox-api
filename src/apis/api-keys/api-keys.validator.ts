import { Injectable, HttpStatus } from '@nestjs/common';
import * as Joi from 'joi';
import { CreateApiKeyDto, UpdateApiKeyDto, GetApiKeysDto } from './dto/api-keys.dto';
import { ApiKeyRepository } from '../../repositories/api-key.repository';
import { DomainRepository } from '../../repositories/domain.repository';
import { throwError } from '../../utils/util';
import { validateJoiSchema } from '../../utils/joi.validator';

@Injectable()
export class ApiKeysValidator {
  constructor(
    private readonly apiKeyRepository: ApiKeyRepository,
    private readonly domainRepository: DomainRepository,
  ) { }

  async validateGetApiKeysRequest(query: GetApiKeysDto): Promise<GetApiKeysDto> {
    // Validate query schema
    const schema = Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
      status: Joi.string().valid('ACTIVE', 'INACTIVE', 'ALL').optional(),
      search: Joi.string().max(100).allow('').optional(),
    });

    const error = validateJoiSchema(schema, query);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return query;
  }

  async validateCreateApiKeyRequest(createApiKeyDto: CreateApiKeyDto, teamId: number): Promise<{ name: string; permission: string; domain?: string }> {
    // 1. Validate DTO schema
    const schema = Joi.object({
      name: Joi.string().required().min(1).max(100).messages({
        'string.min': 'Name must be at least 1 character long',
        'string.max': 'Name must not exceed 100 characters',
        'any.required': 'Name is required',
      }),
      permission: Joi.string().valid('full_access', 'sending_access').required().messages({
        'any.only': 'Permission must be one of: full_access, sending_access',
        'any.required': 'Permission is required',
      }),
      domainId: Joi.number().integer().positive().optional().messages({
        'number.base': 'Domain ID must be a number',
        'number.positive': 'Domain ID must be a positive number',
      })
    });

    const error = validateJoiSchema(schema, createApiKeyDto);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    // Validate domain exists and belongs to team if domainId is provided
    let domainName: string | undefined;
    if (createApiKeyDto.domainId) {
      const domain = await this.domainRepository.findByIdAndTeamId(createApiKeyDto.domainId, teamId);
      if (!domain) {
        throwError('Domain not found', HttpStatus.NOT_FOUND, 'domainNotFound');
      }
      domainName = domain.name;
    }

    return {
      name: createApiKeyDto.name,
      permission: createApiKeyDto.permission,
      domain: domainName,
    };
  }

  async validateGetApiKeyRequest(id: string, teamId: number): Promise<{ apiKeyId: number; apiKey: any }> {
    // 1. Validate ID parameter schema
    const schema = Joi.object({
      id: Joi.string().min(1).required().messages({
        'string.min': 'API key ID must be at least 1 character',
        'any.required': 'API key ID is required',
        'string.empty': 'API key ID cannot be empty',
      }),
      teamId: Joi.number().integer().positive().required().messages({
        'number.base': 'Team ID must be a number',
        'number.positive': 'Team ID must be a positive number',
        'any.required': 'Team ID is required',
      }),
    });

    const validationError = validateJoiSchema(schema, { id, teamId });
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    // 2. Validate API key exists and belongs to team (by reference)
    const apiKey = await this.apiKeyRepository.findByReferenceAndTeamId(id, teamId);
    if (!apiKey) {
      throwError('API key not found', HttpStatus.NOT_FOUND, 'apiKeyNotFound');
    }

    const apiKeyDetails = await this.apiKeyRepository.findById(apiKey.id);

    return { apiKeyId: apiKey.id, apiKey: apiKeyDetails };
  }

  async validateUpdateApiKeyRequest(id: string, updateApiKeyDto: UpdateApiKeyDto, teamId: number): Promise<{ apiKeyId: number; validatedData: { name?: string; permission?: string; domain?: string }; apiKey: any }> {
    // 1. Validate ID parameter schema
    const idSchema = Joi.object({
      id: Joi.string().min(1).required().messages({
        'string.min': 'API key ID must be at least 1 character',
        'any.required': 'API key ID is required',
        'string.empty': 'API key ID cannot be empty',
      }),
      teamId: Joi.number().integer().positive().required().messages({
        'number.base': 'Team ID must be a number',
        'number.positive': 'Team ID must be a positive number',
        'any.required': 'Team ID is required',
      }),
    });

    const idValidationError = validateJoiSchema(idSchema, { id, teamId });
    if (idValidationError) {
      throwError(idValidationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    // 2. Validate DTO schema
    const schema = Joi.object({
      name: Joi.string().optional().min(1).max(100).messages({
        'string.min': 'Name must be at least 1 character long',
        'string.max': 'Name must not exceed 100 characters',
      }),
      permission: Joi.string().valid('full_access', 'sending_access').optional().messages({
        'any.only': 'Permission must be one of: full_access, sending_access',
      }),
      domainId: Joi.number().integer().positive().optional().messages({
        'number.base': 'Domain ID must be a number',
        'number.positive': 'Domain ID must be a positive number',
      })
    });

    const error = validateJoiSchema(schema, updateApiKeyDto);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    // 3. Validate API key exists and belongs to team (by reference)
    const apiKey = await this.apiKeyRepository.findByReferenceAndTeamId(id, teamId);
    if (!apiKey) {
      throwError('API key not found', HttpStatus.NOT_FOUND, 'apiKeyNotFound');
    }

    const apiKeyDetails = await this.apiKeyRepository.findById(apiKey.id);
    const apiKeyId = apiKey.id;

    // 5. Validate domain exists and belongs to team if domainId is provided
    let domainName: string | undefined;
    if (updateApiKeyDto.domainId !== undefined) {
      const domain = await this.domainRepository.findByIdAndTeamId(updateApiKeyDto.domainId, teamId);
      if (!domain) {
        throwError('Domain not found', HttpStatus.NOT_FOUND, 'domainNotFound');
      }
      domainName = domain.name;
    }

    return {
      apiKeyId,
      validatedData: {
        name: updateApiKeyDto.name,
        permission: updateApiKeyDto.permission,
        domain: domainName,
      },
      apiKey: apiKeyDetails,
    };
  }

  async validateDeleteApiKeyRequest(id: string, teamId: number): Promise<{ apiKeyId: number; apiKey: any }> {
    // 1. Validate ID parameter schema
    const schema = Joi.object({
      id: Joi.string().min(1).required().messages({
        'string.min': 'API key ID must be at least 1 character',
        'any.required': 'API key ID is required',
        'string.empty': 'API key ID cannot be empty',
      }),
      teamId: Joi.number().integer().positive().required().messages({
        'number.base': 'Team ID must be a number',
        'number.positive': 'Team ID must be a positive number',
        'any.required': 'Team ID is required',
      }),
    });

    const validationError = validateJoiSchema(schema, { id, teamId });
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    // 2. Validate API key exists and belongs to team (by reference)
    const apiKey = await this.apiKeyRepository.findByReferenceAndTeamId(id, teamId);
    if (!apiKey) {
      throwError('API key not found', HttpStatus.NOT_FOUND, 'apiKeyNotFound');
    }

    return { apiKeyId: apiKey.id, apiKey };
  }
} 