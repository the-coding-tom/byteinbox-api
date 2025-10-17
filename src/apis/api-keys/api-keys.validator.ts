import { Injectable, HttpStatus } from '@nestjs/common';
import * as Joi from 'joi';
import { CreateApiKeyDto, UpdateApiKeyDto, GetApiKeysDto } from './dto/api-keys.dto';
import { ApiKeyRepository } from '../../repositories/api-key.repository';
import { throwError } from '../../utils/util';
import { validateJoiSchema } from '../../utils/joi.validator';

@Injectable()
export class ApiKeysValidator {
  constructor(private readonly apiKeyRepository: ApiKeyRepository) { }

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

  async validateCreateApiKeyRequest(createApiKeyDto: CreateApiKeyDto, teamId: number): Promise<CreateApiKeyDto> {
    // 1. Validate DTO schema
    const schema = Joi.object({
      name: Joi.string().required().min(1).max(100).messages({
        'string.min': 'Name must be at least 1 character long',
        'string.max': 'Name must not exceed 100 characters',
        'any.required': 'Name is required',
      }),
      permission: Joi.string().valid('full', 'sending').required().messages({
        'any.only': 'Permission must be one of: full, sending',
        'any.required': 'Permission is required',
      }),
      domain: Joi.string().optional().allow('').messages({
        'string.base': 'Domain must be a string',
      })
    });

    const error = validateJoiSchema(schema, createApiKeyDto);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return createApiKeyDto;
  }

  async validateGetApiKeyRequest(id: string, teamId: number): Promise<{ apiKeyId: number; apiKey: any }> {
    // 1. Parse and validate ID parameter
    const apiKeyId = parseInt(id);
    if (isNaN(apiKeyId) || apiKeyId <= 0) {
      throwError('Invalid ID', HttpStatus.BAD_REQUEST, 'invalidId');
    }

    // 2. Validate API key exists and belongs to team
    const apiKey = await this.apiKeyRepository.findById(apiKeyId);
    if (!apiKey) {
      throwError('API key not found', HttpStatus.NOT_FOUND, 'apiKeyNotFound');
    }

    if (apiKey.teamId !== teamId) {
      throwError('API key does not belong to this team', HttpStatus.FORBIDDEN, 'apiKeyAccessDenied');
    }

    return { apiKeyId, apiKey };
  }

  async validateUpdateApiKeyRequest(id: string, updateApiKeyDto: UpdateApiKeyDto, teamId: number): Promise<{ apiKeyId: number; validatedData: UpdateApiKeyDto; apiKey: any }> {
    // 1. Validate DTO schema
    const schema = Joi.object({
      name: Joi.string().optional().min(1).max(100).messages({
        'string.min': 'Name must be at least 1 character long',
        'string.max': 'Name must not exceed 100 characters',
      }),
      permission: Joi.string().valid('full', 'sending').optional().messages({
        'any.only': 'Permission must be one of: full, sending',
      }),
      domain: Joi.string().optional().allow('').messages({
        'string.base': 'Domain must be a string',
      }),
      status: Joi.string().valid('active', 'revoked').optional().messages({
        'any.only': 'Status must be one of: active, revoked',
      })
    });

    const error = validateJoiSchema(schema, updateApiKeyDto);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    // 2. Parse and validate ID parameter
    const apiKeyId = parseInt(id);
    if (isNaN(apiKeyId) || apiKeyId <= 0) {
      throwError('Invalid ID', HttpStatus.BAD_REQUEST, 'invalidId');
    }

    // 3. Validate API key exists and belongs to team
    const apiKey = await this.apiKeyRepository.findById(apiKeyId);
    if (!apiKey) {
      throwError('API key not found', HttpStatus.NOT_FOUND, 'apiKeyNotFound');
    }

    if (apiKey.teamId !== teamId) {
      throwError('API key does not belong to this team', HttpStatus.FORBIDDEN, 'apiKeyAccessDenied');
    }

    return { apiKeyId, validatedData: updateApiKeyDto, apiKey };
  }

  async validateDeleteApiKeyRequest(id: string, teamId: number): Promise<{ apiKeyId: number; apiKey: any }> {
    // 1. Parse and validate ID parameter
    const apiKeyId = parseInt(id);
    if (isNaN(apiKeyId) || apiKeyId <= 0) {
      throwError('Invalid ID', HttpStatus.BAD_REQUEST, 'invalidId');
    }

    // 2. Validate API key exists and belongs to team
    const apiKey = await this.apiKeyRepository.findById(apiKeyId);
    if (!apiKey) {
      throwError('API key not found', HttpStatus.NOT_FOUND, 'apiKeyNotFound');
    }

    if (apiKey.teamId !== teamId) {
      throwError('API key does not belong to this team', HttpStatus.FORBIDDEN, 'apiKeyAccessDenied');
    }

    return { apiKeyId, apiKey };
  }
} 