import { Injectable, HttpStatus } from '@nestjs/common';
import * as Joi from 'joi';
import { CreateApiKeyDto, UpdateApiKeyDto, GetApiKeysDto } from './dto/api-keys.dto';
import { TeamApiKeyRepository } from '../../repositories/team-api-key.repository';
import { throwError } from '../../utils/util';
import { validateJoiSchema } from '../../utils/joi.validator';
import prisma from '../../common/prisma';

@Injectable()
export class ApiKeysValidator {
  constructor(private readonly teamApiKeyRepository: TeamApiKeyRepository) {}

  // API KEY QUERY VALIDATION

  async validateGetApiKeys(query: GetApiKeysDto, teamId: number, userId: number): Promise<{ validatedData: GetApiKeysDto; teamId: number }> {
    // Validate query parameters
    const schema = Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
      status: Joi.string().valid('ACTIVE', 'INACTIVE', 'ALL').optional(),
      search: Joi.string().max(100).optional(),
    });

    const error = validateJoiSchema(schema, query);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    // Validate team access
    const team = await prisma.team.findUnique({
      where: { id: teamId }
    });
    if (!team) {
      throwError('Team not found', HttpStatus.NOT_FOUND, 'teamNotFound');
    }

    const member = await prisma.teamMember.findFirst({
      where: {
        teamId: teamId,
        userId: userId,
        status: 'ACTIVE'
      }
    });
    if (!member) {
      throwError('You do not have access to this team', HttpStatus.FORBIDDEN, 'teamAccessDenied');
    }

    return { validatedData: query, teamId };
  }

  // API KEY CRUD VALIDATION

  async validateCreateApiKey(createApiKeyDto: CreateApiKeyDto, teamId: number, userId: number): Promise<{ validatedData: CreateApiKeyDto; teamId: number }> {
    // Validate DTO
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

    // Validate team access
    const team = await prisma.team.findUnique({
      where: { id: teamId }
    });
    if (!team) {
      throwError('Team not found', HttpStatus.NOT_FOUND, 'teamNotFound');
    }

    const member = await prisma.teamMember.findFirst({
      where: {
        teamId: teamId,
        userId: userId,
        status: 'ACTIVE'
      }
    });
    if (!member) {
      throwError('You do not have access to this team', HttpStatus.FORBIDDEN, 'teamAccessDenied');
    }

    // Check if API key name is unique within the team
    const existingKey = await this.teamApiKeyRepository.findByTeamIdAndName(teamId, createApiKeyDto.name);
    if (existingKey) {
      throwError('API key name already exists in this team', HttpStatus.CONFLICT, 'apiKeyNameExists');
    }

    return { validatedData: createApiKeyDto, teamId };
  }

  async validateGetApiKey(apiKeyId: number, teamId: number, userId: number): Promise<{ apiKeyId: number; teamId: number; apiKey: any }> {
    // Validate team access
    const team = await prisma.team.findUnique({
      where: { id: teamId }
    });
    if (!team) {
      throwError('Team not found', HttpStatus.NOT_FOUND, 'teamNotFound');
    }

    const member = await prisma.teamMember.findFirst({
      where: {
        teamId: teamId,
        userId: userId,
        status: 'ACTIVE'
      }
    });
    if (!member) {
      throwError('You do not have access to this team', HttpStatus.FORBIDDEN, 'teamAccessDenied');
    }

    // Validate API key exists and belongs to team
    const apiKey = await this.teamApiKeyRepository.findById(apiKeyId);
    if (!apiKey) {
      throwError('API key not found', HttpStatus.NOT_FOUND, 'apiKeyNotFound');
    }

    if (apiKey.teamId !== teamId) {
      throwError('API key does not belong to this team', HttpStatus.FORBIDDEN, 'apiKeyAccessDenied');
    }

    return { apiKeyId, teamId, apiKey };
  }

  async validateUpdateApiKey(apiKeyId: number, updateApiKeyDto: UpdateApiKeyDto, teamId: number, userId: number): Promise<{ apiKeyId: number; validatedData: UpdateApiKeyDto; teamId: number; apiKey: any }> {
    // Validate DTO
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

    // Validate team access
    const team = await prisma.team.findUnique({
      where: { id: teamId }
    });
    if (!team) {
      throwError('Team not found', HttpStatus.NOT_FOUND, 'teamNotFound');
    }

    const member = await prisma.teamMember.findFirst({
      where: {
        teamId: teamId,
        userId: userId,
        status: 'ACTIVE'
      }
    });
    if (!member) {
      throwError('You do not have access to this team', HttpStatus.FORBIDDEN, 'teamAccessDenied');
    }

    // Validate API key exists and belongs to team
    const apiKey = await this.teamApiKeyRepository.findById(apiKeyId);
    if (!apiKey) {
      throwError('API key not found', HttpStatus.NOT_FOUND, 'apiKeyNotFound');
    }

    if (apiKey.teamId !== teamId) {
      throwError('API key does not belong to this team', HttpStatus.FORBIDDEN, 'apiKeyAccessDenied');
    }

    // Check if API key name is unique within the team (if name is being updated)
    if (updateApiKeyDto.name && updateApiKeyDto.name !== apiKey.name) {
      const existingKey = await this.teamApiKeyRepository.findByTeamIdAndName(teamId, updateApiKeyDto.name);
      if (existingKey && existingKey.id !== apiKeyId) {
        throwError('API key name already exists in this team', HttpStatus.CONFLICT, 'apiKeyNameExists');
      }
    }

    return { apiKeyId, validatedData: updateApiKeyDto, teamId, apiKey };
  }

  async validateDeleteApiKey(apiKeyId: number, teamId: number, userId: number): Promise<{ apiKeyId: number; teamId: number; apiKey: any }> {
    // Validate team access
    const team = await prisma.team.findUnique({
      where: { id: teamId }
    });
    if (!team) {
      throwError('Team not found', HttpStatus.NOT_FOUND, 'teamNotFound');
    }

    const member = await prisma.teamMember.findFirst({
      where: {
        teamId: teamId,
        userId: userId,
        status: 'ACTIVE'
      }
    });
    if (!member) {
      throwError('You do not have access to this team', HttpStatus.FORBIDDEN, 'teamAccessDenied');
    }

    // Validate API key exists and belongs to team
    const apiKey = await this.teamApiKeyRepository.findById(apiKeyId);
    if (!apiKey) {
      throwError('API key not found', HttpStatus.NOT_FOUND, 'apiKeyNotFound');
    }

    if (apiKey.teamId !== teamId) {
      throwError('API key does not belong to this team', HttpStatus.FORBIDDEN, 'apiKeyAccessDenied');
    }

    return { apiKeyId, teamId, apiKey };
  }

  // API KEY TESTING VALIDATION

  async validateTestApiKey(apiKey: string): Promise<{ apiKey: string; apiKeyData: any }> {
    // Validate API key format
    if (!apiKey || !apiKey.startsWith('ak_')) {
      throwError('Invalid API key format', HttpStatus.UNAUTHORIZED, 'invalidApiKeyFormat');
    }

    // Find API key in database
    const apiKeyData = await this.teamApiKeyRepository.findByKey(apiKey);
    if (!apiKeyData) {
      throwError('Invalid API key', HttpStatus.UNAUTHORIZED, 'invalidApiKey');
    }

    // Check if API key is active
    if (!apiKeyData.isActive) {
      throwError('API key is inactive', HttpStatus.UNAUTHORIZED, 'inactiveApiKey');
    }

    // Check if API key has expired
    if (apiKeyData.expiresAt && apiKeyData.expiresAt < new Date()) {
      throwError('API key has expired', HttpStatus.UNAUTHORIZED, 'expiredApiKey');
    }

    return { apiKey, apiKeyData };
  }
} 