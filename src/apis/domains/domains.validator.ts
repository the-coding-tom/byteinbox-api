import { Injectable, HttpStatus } from '@nestjs/common';
import { validateJoiSchema } from '../../utils/joi.validator';
import { throwError } from '../../utils/util';
import { AddDomainDto, UpdateDomainDto, UpdateDomainSettingsDto, GetDomainsFilterDto } from './dto/domains.dto';
import { DomainRepository } from '../../repositories/domain.repository';
import * as Joi from 'joi';

@Injectable()
export class DomainsValidator {
  constructor(private readonly domainRepository: DomainRepository) {}
  async validateAddDomain(data: AddDomainDto, teamId: number): Promise<{ validatedData: AddDomainDto }> {
    const schema = Joi.object({
      domainName: Joi.string().min(3).max(253).required().pattern(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i).messages({
        'string.min': 'Domain name must be at least 3 characters',
        'string.max': 'Domain name must not exceed 253 characters',
        'any.required': 'Domain name is required',
        'string.pattern.base': 'Invalid domain name format',
      }),
      region: Joi.string().required().messages({
        'any.required': 'Region is required',
      }),
    });

    const validationError = validateJoiSchema(schema, data);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    // Check if domain already exists for this team
    const existingDomain = await this.domainRepository.findByTeamIdAndName(teamId, data.domainName);
    if (existingDomain) {
      throwError('Domain already exists in this team', HttpStatus.BAD_REQUEST, 'domainExists');
    }

    return { validatedData: data };
  }

  async validateUpdateDomain(data: UpdateDomainDto): Promise<{ validatedData: UpdateDomainDto }> {
    const schema = Joi.object({
      name: Joi.string().min(3).max(253).optional().pattern(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i).messages({
        'string.min': 'Domain name must be at least 3 characters',
        'string.max': 'Domain name must not exceed 253 characters',
        'string.pattern.base': 'Invalid domain name format',
      }),
      region: Joi.string().optional(),
      clickTracking: Joi.boolean().optional(),
      openTracking: Joi.boolean().optional(),
      tlsMode: Joi.string().valid('enforced', 'opportunistic', 'disabled').optional().messages({
        'any.only': 'TLS mode must be one of: enforced, opportunistic, disabled',
      }),
    });

    const validationError = validateJoiSchema(schema, data);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    return { validatedData: data };
  }

  async validateUpdateDomainSettings(domainId: string, teamId: number, data: UpdateDomainSettingsDto): Promise<{ validatedData: { domainId: number; teamId: number; validatedData: UpdateDomainSettingsDto } }> {
    const schema = Joi.object({
      domainId: Joi.string().required().messages({
        'any.required': 'Domain ID is required',
      }),
      teamId: Joi.number().integer().min(1).required().messages({
        'number.base': 'Team ID must be a number',
        'number.integer': 'Team ID must be an integer',
        'number.min': 'Team ID must be greater than 0',
        'any.required': 'Team ID is required',
      }),
      clickTracking: Joi.boolean().optional(),
      openTracking: Joi.boolean().optional(),
      tlsMode: Joi.string().valid('enforced', 'opportunistic', 'disabled').optional().messages({
        'any.only': 'TLS mode must be one of: enforced, opportunistic, disabled',
      }),
    });

    const validationData = { domainId, teamId, ...data };
    const validationError = validateJoiSchema(schema, validationData);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    // Parse domainId to number
    const parsedDomainId = parseInt(domainId);

    // Check if domain exists and belongs to team
    const domain = await this.domainRepository.findById(parsedDomainId);
    if (!domain) {
      throwError('Domain not found', HttpStatus.NOT_FOUND, 'validationError');
    }

    if (domain.teamId !== teamId) {
      throwError('Access denied: Domain does not belong to your team', HttpStatus.FORBIDDEN, 'validationError');
    }

    return { validatedData: { domainId: parsedDomainId, teamId, validatedData: data } };
  }

  async validateGetDomains(teamId: number, filter: GetDomainsFilterDto): Promise<{ validatedData: { teamId: number; filter: GetDomainsFilterDto } }> {
    const schema = Joi.object({
      keyword: Joi.string().optional(),
      status: Joi.string().optional(),
      region: Joi.string().optional(),
      offset: Joi.number().min(0).optional(),
      limit: Joi.number().min(1).max(100).optional(),
    });

    const validationError = validateJoiSchema(schema, filter);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    // Validate teamId
    if (!teamId || teamId <= 0) {
      throwError('Invalid team ID', HttpStatus.BAD_REQUEST, 'validationError');
    }

    return { validatedData: { teamId, filter } };
  }

  async validateGetDomainDetails(domainId: string, teamId: number): Promise<{ validatedData: { domainId: number; teamId: number } }> {
    const schema = Joi.object({
      domainId: Joi.string().required().messages({
        'any.required': 'Domain ID is required',
      }),
      teamId: Joi.number().integer().min(1).required().messages({
        'number.base': 'Team ID must be a number',
        'number.integer': 'Team ID must be an integer',
        'number.min': 'Team ID must be greater than 0',
        'any.required': 'Team ID is required',
      }),
    });

    const data = { domainId, teamId };
    const validationError = validateJoiSchema(schema, data);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    // Parse domainId to number
    const parsedDomainId = parseInt(domainId);

    // Check if domain exists and belongs to team
    const domain = await this.domainRepository.findById(parsedDomainId);
    if (!domain) {
      throwError('Domain not found', HttpStatus.NOT_FOUND, 'validationError');
    }

    if (domain.teamId !== teamId) {
      throwError('Access denied: Domain does not belong to your team', HttpStatus.FORBIDDEN, 'validationError');
    }

    return { validatedData: { domainId: parsedDomainId, teamId } };
  }

  async validateDeleteDomain(domainId: string, teamId: number): Promise<{ validatedData: { domainId: number; teamId: number; domain: any } }> {
    const schema = Joi.object({
      domainId: Joi.string().required().messages({
        'any.required': 'Domain ID is required',
      }),
      teamId: Joi.number().integer().min(1).required().messages({
        'number.base': 'Team ID must be a number',
        'number.integer': 'Team ID must be an integer',
        'number.min': 'Team ID must be greater than 0',
        'any.required': 'Team ID is required',
      }),
    });

    const data = { domainId, teamId };
    const validationError = validateJoiSchema(schema, data);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    // Parse domainId to number
    const parsedDomainId = parseInt(domainId);

    // Check if domain exists and belongs to team
    const domain = await this.domainRepository.findById(parsedDomainId);
    if (!domain) {
      throwError('Domain not found', HttpStatus.NOT_FOUND, 'domainNotFound');
    }

    if (domain.teamId !== teamId) {
      throwError('Access denied: Domain does not belong to your team', HttpStatus.FORBIDDEN, 'accessDenied');
    }

    return { validatedData: { domainId: parsedDomainId, teamId, domain } };
  }

  async validateRestartDomain(domainId: string, teamId: number): Promise<{ validatedData: { domainId: number; teamId: number; domain: any } }> {
    const schema = Joi.object({
      domainId: Joi.string().required().messages({
        'any.required': 'Domain ID is required',
      }),
      teamId: Joi.number().integer().min(1).required().messages({
        'number.base': 'Team ID must be a number',
        'number.integer': 'Team ID must be an integer',
        'number.min': 'Team ID must be greater than 0',
        'any.required': 'Team ID is required',
      }),
    });

    const data = { domainId, teamId };
    const validationError = validateJoiSchema(schema, data);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    // Parse domainId to number
    const parsedDomainId = parseInt(domainId);

    // Check if domain exists and belongs to team
    const domain = await this.domainRepository.findById(parsedDomainId);
    if (!domain) {
      throwError('Domain not found', HttpStatus.NOT_FOUND, 'domainNotFound');
    }

    if (domain.teamId !== teamId) {
      throwError('Access denied: Domain does not belong to your team', HttpStatus.FORBIDDEN, 'accessDenied');
    }

    return { validatedData: { domainId: parsedDomainId, teamId, domain } };
  }
}
