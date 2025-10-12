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
      search: Joi.string().max(100).optional(),
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
      description: Joi.string().optional().max(500).messages({
        'string.max': 'Description must not exceed 500 characters',
      }),
      scopes: Joi.array().items(Joi.string()).min(1).required().messages({
        'array.min': 'At least one scope is required',
        'any.required': 'Scopes are required',
      }),
      expiresAt: Joi.date().optional().greater('now').messages({
        'date.greater': 'Expiration date must be in the future',
      })
    });

    const error = validateJoiSchema(schema, createApiKeyDto);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    // 2. Business logic validation - Check if API key name is unique within the team
    const existingKey = await this.apiKeyRepository.findByTeamIdAndName(teamId, createApiKeyDto.name);
    if (existingKey) {
      throwError('API key name already exists in this team', HttpStatus.CONFLICT, 'apiKeyNameExists');
    }

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
      description: Joi.string().optional().max(500).messages({
        'string.max': 'Description must not exceed 500 characters',
      }),
      scopes: Joi.array().items(Joi.string()).min(1).optional().messages({
        'array.min': 'At least one scope is required',
      }),
      expiresAt: Joi.date().optional().greater('now').messages({
        'date.greater': 'Expiration date must be in the future',
      }),
      isActive: Joi.boolean().optional()
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

    // 4. Business logic validation - Check if API key name is unique within the team (if name is being updated)
    if (updateApiKeyDto.name && updateApiKeyDto.name !== apiKey.name) {
      const existingKey = await this.apiKeyRepository.findByTeamIdAndName(teamId, updateApiKeyDto.name);
      if (existingKey && existingKey.id !== apiKeyId) {
        throwError('API key name already exists in this team', HttpStatus.CONFLICT, 'apiKeyNameExists');
      }
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