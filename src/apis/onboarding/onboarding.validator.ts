import { Injectable, HttpStatus } from '@nestjs/common';
import { validateJoiSchema } from '../../utils/joi.validator';
import { throwError } from '../../utils/util';
import { GenerateApiKeyDto, UpdateStepDto, SendTestEmailDto } from './dto/onboarding.dto';
import * as Joi from 'joi';

@Injectable()
export class OnboardingValidator {
  async validateGenerateApiKey(data: GenerateApiKeyDto): Promise<{ validatedData: GenerateApiKeyDto }> {
    const schema = Joi.object({
      name: Joi.string().min(1).max(100).required().messages({
        'string.min': 'API key name must be at least 1 character',
        'string.max': 'API key name must not exceed 100 characters',
        'any.required': 'API key name is required',
      }),
      permission: Joi.string().valid('full', 'sending', 'readonly').required().messages({
        'any.only': 'Permission must be one of: full, sending, readonly',
        'any.required': 'Permission is required',
      }),
      domain: Joi.string().optional().allow(''),
    });

    const validationError = validateJoiSchema(schema, data);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    return { validatedData: data };
  }

  async validateUpdateStep(data: UpdateStepDto): Promise<{ validatedData: UpdateStepDto }> {
    const schema = Joi.object({
      stepId: Joi.string().required().messages({
        'any.required': 'Step ID is required',
      }),
      completed: Joi.boolean().required().messages({
        'any.required': 'Completed status is required',
      }),
    });

    const validationError = validateJoiSchema(schema, data);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    return { validatedData: data };
  }

  async validateSendTestEmail(data: SendTestEmailDto): Promise<{ validatedData: SendTestEmailDto }> {
    const schema = Joi.object({
      to: Joi.string().email().required().messages({
        'string.email': 'Invalid email address',
        'any.required': 'Recipient email is required',
      }),
      subject: Joi.string().min(1).max(200).required().messages({
        'string.min': 'Subject must be at least 1 character',
        'string.max': 'Subject must not exceed 200 characters',
        'any.required': 'Subject is required',
      }),
      content: Joi.string().min(1).required().messages({
        'string.min': 'Content must be at least 1 character',
        'any.required': 'Content is required',
      }),
    });

    const validationError = validateJoiSchema(schema, data);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    return { validatedData: data };
  }
}
