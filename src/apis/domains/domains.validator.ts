import { Injectable, HttpStatus } from '@nestjs/common';
import { validateJoiSchema } from '../../utils/joi.validator';
import { throwError } from '../../utils/util';
import { AddDomainDto, UpdateDomainDto, UpdateDomainConfigurationDto } from './dto/domains.dto';
import * as Joi from 'joi';

@Injectable()
export class DomainsValidator {
  async validateCreateDomain(data: AddDomainDto): Promise<{ validatedData: AddDomainDto }> {
    const schema = Joi.object({
      domainName: Joi.string().min(3).max(253).required().messages({
        'string.min': 'Domain name must be at least 3 characters',
        'string.max': 'Domain name must not exceed 253 characters',
        'any.required': 'Domain name is required',
      }),
      region: Joi.string().required().messages({
        'any.required': 'Region is required',
      }),
    });

    const validationError = validateJoiSchema(schema, data);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    return { validatedData: data };
  }

  async validateUpdateDomain(data: UpdateDomainDto): Promise<{ validatedData: UpdateDomainDto }> {
    const schema = Joi.object({
      name: Joi.string().min(3).max(253).optional().messages({
        'string.min': 'Domain name must be at least 3 characters',
        'string.max': 'Domain name must not exceed 253 characters',
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

  async validateUpdateDomainConfiguration(data: UpdateDomainConfigurationDto): Promise<{ validatedData: UpdateDomainConfigurationDto }> {
    const schema = Joi.object({
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
}
