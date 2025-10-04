import { Injectable, HttpStatus } from '@nestjs/common';
import * as Joi from 'joi';
import { throwError } from '../../../utils/util';
import { validateJoiSchema } from '../../../utils/joi.validator';
import { BlacklistType, BlacklistReason, BlacklistDuration } from '@prisma/client';
import { BlacklistRepository } from '../../../repositories/blacklist.repository';
import {
  GetSecurityActivityDto,
  GetBlacklistStatsDto,
  GetBlacklistEntriesDto,
  CreateBlacklistEntryDto,
  UpdateBlacklistEntryDto,
  GetRateLimitStatsDto,
  ClearUserRateLimitsDto,
  ClearBlacklistEntryDto,
} from './dto/security.dto';

@Injectable()
export class AdminSecurityValidator {
  constructor(private readonly blacklistRepository: BlacklistRepository) {}

  async validateGetSecurityActivity(data: GetSecurityActivityDto): Promise<GetSecurityActivityDto> {
    const schema = Joi.object({
      userId: Joi.number().positive().optional().messages({
        'number.positive': 'User ID must be positive',
      }),
      startDate: Joi.string().isoDate().optional().messages({
        'string.isoDate': 'Start date must be a valid ISO date',
      }),
      endDate: Joi.string().isoDate().optional().messages({
        'string.isoDate': 'End date must be a valid ISO date',
      }),
      limit: Joi.number().min(1).max(100).optional().default(10).messages({
        'number.min': 'Limit must be 1 or greater',
        'number.max': 'Limit must not exceed 100',
      }),
      offset: Joi.number().min(0).optional().default(0).messages({
        'number.min': 'Offset must be 0 or greater',
      }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return data;
  }

  async validateGetBlacklistStats(data: GetBlacklistStatsDto): Promise<GetBlacklistStatsDto> {
    const schema = Joi.object({
      startDate: Joi.string().isoDate().optional().messages({
        'string.isoDate': 'Start date must be a valid ISO date',
      }),
      endDate: Joi.string().isoDate().optional().messages({
        'string.isoDate': 'End date must be a valid ISO date',
      }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return data;
  }

  async validateGetRateLimitStats(data: GetRateLimitStatsDto): Promise<GetRateLimitStatsDto> {
    const schema = Joi.object({
      userId: Joi.number().positive().optional().messages({
        'number.positive': 'User ID must be positive',
      }),
      startDate: Joi.string().isoDate().optional().messages({
        'string.isoDate': 'Start date must be a valid ISO date',
      }),
      endDate: Joi.string().isoDate().optional().messages({
        'string.isoDate': 'End date must be a valid ISO date',
      }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return data;
  }

  async validateClearUserRateLimits(data: ClearUserRateLimitsDto): Promise<ClearUserRateLimitsDto> {
    const schema = Joi.object({
      userId: Joi.number().required().positive().messages({
        'any.required': 'User ID is required',
        'number.positive': 'User ID must be positive',
      }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return data;
  }

  async validateClearBlacklistEntry(data: ClearBlacklistEntryDto): Promise<ClearBlacklistEntryDto> {
    const schema = Joi.object({
      id: Joi.number().required().positive().messages({
        'any.required': 'Blacklist entry ID is required',
        'number.positive': 'Blacklist entry ID must be positive',
      }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return data;
  }

  // Blacklist CRUD Validation
  async validateGetBlacklistEntries(data: GetBlacklistEntriesDto): Promise<GetBlacklistEntriesDto> {
    const schema = Joi.object({
      offset: Joi.number().min(0).optional().default(0).messages({
        'number.min': 'Offset must be 0 or greater',
      }),
      limit: Joi.number().min(1).max(100).optional().default(10).messages({
        'number.min': 'Limit must be 1 or greater',
        'number.max': 'Limit must not exceed 100',
      }),
      type: Joi.string()
        .valid(...Object.values(BlacklistType))
        .optional()
        .messages({
          'any.only': `Type must be one of: ${Object.values(BlacklistType).join(', ')}`,
        }),
      isActive: Joi.boolean().optional().messages({
        'boolean.base': 'isActive must be a boolean',
      }),
      keyword: Joi.string().max(100).optional().messages({
        'string.max': 'Keyword must not exceed 100 characters',
      }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return data;
  }

  async validateCreateBlacklistEntry(
    data: CreateBlacklistEntryDto,
  ): Promise<CreateBlacklistEntryDto> {
    const schema = Joi.object({
      type: Joi.string()
        .valid(...Object.values(BlacklistType))
        .required()
        .messages({
          'any.required': 'Type is required',
          'any.only': `Type must be one of: ${Object.values(BlacklistType).join(', ')}`,
        }),
      value: Joi.string().required().max(255).messages({
        'any.required': 'Value is required',
        'string.max': 'Value must not exceed 255 characters',
      }),
      reason: Joi.string()
        .valid(...Object.values(BlacklistReason))
        .required()
        .messages({
          'any.required': 'Reason is required',
          'any.only': `Reason must be one of: ${Object.values(BlacklistReason).join(', ')}`,
        }),
      duration: Joi.string()
        .valid(...Object.values(BlacklistDuration))
        .required()
        .messages({
          'any.required': 'Duration is required',
          'any.only': `Duration must be one of: ${Object.values(BlacklistDuration).join(', ')}`,
        }),
      description: Joi.string().max(500).optional().messages({
        'string.max': 'Description must not exceed 500 characters',
      }),
      metadata: Joi.object().optional().messages({
        'object.base': 'Metadata must be an object',
      }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    // Check if blacklist entry already exists
    const existingEntry = await this.blacklistRepository.findBlacklist(data.type, data.value);
    if (existingEntry) {
      throwError(
        `Blacklist entry already exists for ${data.type}: ${data.value}`,
        HttpStatus.CONFLICT,
        'blacklistEntryAlreadyExists',
      );
    }

    return data;
  }

  async validateUpdateBlacklistEntry(
    data: UpdateBlacklistEntryDto,
  ): Promise<UpdateBlacklistEntryDto> {
    const schema = Joi.object({
      type: Joi.string()
        .valid(...Object.values(BlacklistType))
        .optional()
        .messages({
          'any.only': 'Type must be a valid blacklist type',
        }),
      reason: Joi.string()
        .valid(...Object.values(BlacklistReason))
        .optional()
        .messages({
          'any.only': 'Reason must be a valid blacklist reason',
        }),
      duration: Joi.string()
        .valid(...Object.values(BlacklistDuration))
        .optional()
        .messages({
          'any.only': 'Duration must be a valid blacklist duration',
        }),
      isActive: Joi.boolean().optional().messages({
        'boolean.base': 'isActive must be a boolean',
      }),
      expiresAt: Joi.date().greater('now').optional().messages({
        'date.greater': 'Expiration date must be in the future',
      }),
    });

    const error = validateJoiSchema(schema, data);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return data;
  }

  async validateBlacklistEntryExists(blacklistId: number): Promise<number> {
    const schema = Joi.object({
      blacklistId: Joi.number().integer().positive().required().messages({
        'number.base': 'Blacklist ID must be a number',
        'number.integer': 'Blacklist ID must be an integer',
        'number.positive': 'Blacklist ID must be positive',
        'any.required': 'Blacklist ID is required',
      }),
    });

    const error = validateJoiSchema(schema, { blacklistId });
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    // Check if blacklist entry exists
    const blacklistEntry = await this.blacklistRepository.findById(blacklistId);
    if (!blacklistEntry) {
      throwError('Blacklist entry not found', HttpStatus.NOT_FOUND, 'blacklistEntryNotFound');
    }

    return blacklistId;
  }
}
