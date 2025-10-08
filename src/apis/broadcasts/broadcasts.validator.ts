import { Injectable, HttpStatus } from '@nestjs/common';
import { validateJoiSchema } from '../../utils/joi.validator';
import { throwError } from '../../utils/util';
import { CreateBroadcastDto, UpdateBroadcastDto, AutoSaveBroadcastDto, SendTestBroadcastDto, BroadcastFilterDto } from './dto/broadcasts.dto';
import * as Joi from 'joi';

@Injectable()
export class BroadcastsValidator {
  async validateCreateBroadcast(data: CreateBroadcastDto): Promise<{ validatedData: CreateBroadcastDto }> {
    const schema = Joi.object({
      name: Joi.string().min(1).max(100).required().messages({
        'string.min': 'Broadcast name must be at least 1 character',
        'string.max': 'Broadcast name must not exceed 100 characters',
        'any.required': 'Broadcast name is required',
      }),
      subject: Joi.string().min(1).max(200).required().messages({
        'string.min': 'Subject must be at least 1 character',
        'string.max': 'Subject must not exceed 200 characters',
        'any.required': 'Subject is required',
      }),
      content: Joi.string().optional(),
      templateId: Joi.string().optional(),
      audienceId: Joi.string().optional(),
      scheduledAt: Joi.date().iso().optional().messages({
        'date.format': 'Scheduled date must be in ISO format',
      }),
    }).custom((value, helpers) => {
      // Either content or templateId must be provided
      if (!value.content && !value.templateId) {
        return helpers.error('custom.contentOrTemplateRequired');
      }
      return value;
    }).messages({
      'custom.contentOrTemplateRequired': 'Either content or templateId must be provided',
    });

    const validationError = validateJoiSchema(schema, data);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    return { validatedData: data };
  }

  async validateUpdateBroadcast(data: UpdateBroadcastDto): Promise<{ validatedData: UpdateBroadcastDto }> {
    const schema = Joi.object({
      name: Joi.string().min(1).max(100).optional().messages({
        'string.min': 'Broadcast name must be at least 1 character',
        'string.max': 'Broadcast name must not exceed 100 characters',
      }),
      subject: Joi.string().min(1).max(200).optional().messages({
        'string.min': 'Subject must be at least 1 character',
        'string.max': 'Subject must not exceed 200 characters',
      }),
      content: Joi.string().optional(),
      templateId: Joi.string().optional(),
      audienceId: Joi.string().optional(),
      scheduledAt: Joi.date().iso().optional().messages({
        'date.format': 'Scheduled date must be in ISO format',
      }),
    });

    const validationError = validateJoiSchema(schema, data);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    return { validatedData: data };
  }

  async validateAutoSaveBroadcast(data: AutoSaveBroadcastDto): Promise<{ validatedData: AutoSaveBroadcastDto }> {
    const schema = Joi.object({
      subject: Joi.string().max(200).optional(),
      content: Joi.string().optional(),
      audienceId: Joi.string().optional(),
      templateId: Joi.string().optional(),
      scheduledAt: Joi.date().iso().optional(),
    });

    const validationError = validateJoiSchema(schema, data);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    return { validatedData: data };
  }

  async validateSendTestBroadcast(data: SendTestBroadcastDto): Promise<{ validatedData: SendTestBroadcastDto }> {
    const schema = Joi.object({
      testEmails: Joi.array()
        .items(Joi.string().email())
        .min(1)
        .max(10)
        .required()
        .messages({
          'array.min': 'At least one test email is required',
          'array.max': 'Maximum 10 test emails allowed',
          'string.email': 'Invalid email format',
        }),
    });

    const validationError = validateJoiSchema(schema, data);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    return { validatedData: data };
  }

  async validateGetBroadcastsQuery(filter: BroadcastFilterDto): Promise<{ validatedData: BroadcastFilterDto }> {
    const schema = Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
      status: Joi.string().valid('draft', 'scheduled', 'sending', 'sent', 'cancelled').optional(),
      audience: Joi.string().valid('all', 'premium', 'custom').optional(),
    });

    const validationError = validateJoiSchema(schema, filter);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    return { validatedData: filter };
  }
}
