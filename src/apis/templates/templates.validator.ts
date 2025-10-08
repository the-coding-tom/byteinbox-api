import { Injectable, HttpStatus } from '@nestjs/common';
import { validateJoiSchema } from '../../utils/joi.validator';
import { throwError } from '../../utils/util';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/templates.dto';
import * as Joi from 'joi';

@Injectable()
export class TemplatesValidator {
  async validateCreateTemplate(data: CreateTemplateDto): Promise<{ validatedData: CreateTemplateDto }> {
    const schema = Joi.object({
      name: Joi.string().min(1).max(100).required().messages({
        'string.min': 'Template name must be at least 1 character',
        'string.max': 'Template name must not exceed 100 characters',
        'any.required': 'Template name is required',
      }),
      description: Joi.string().max(500).optional().messages({
        'string.max': 'Description must not exceed 500 characters',
      }),
      html: Joi.string().min(1).required().messages({
        'string.min': 'HTML content must be at least 1 character',
        'any.required': 'HTML content is required',
      }),
      subject: Joi.string().max(200).optional().messages({
        'string.max': 'Subject must not exceed 200 characters',
      }),
      category: Joi.string().max(50).optional().messages({
        'string.max': 'Category must not exceed 50 characters',
      }),
      variables: Joi.array().items(Joi.string()).optional(),
    });

    const validationError = validateJoiSchema(schema, data);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    return { validatedData: data };
  }

  async validateUpdateTemplate(data: UpdateTemplateDto): Promise<{ validatedData: UpdateTemplateDto }> {
    const schema = Joi.object({
      name: Joi.string().min(1).max(100).optional().messages({
        'string.min': 'Template name must be at least 1 character',
        'string.max': 'Template name must not exceed 100 characters',
      }),
      description: Joi.string().max(500).optional().messages({
        'string.max': 'Description must not exceed 500 characters',
      }),
      html: Joi.string().min(1).optional().messages({
        'string.min': 'HTML content must be at least 1 character',
      }),
      subject: Joi.string().max(200).optional().messages({
        'string.max': 'Subject must not exceed 200 characters',
      }),
      category: Joi.string().max(50).optional().messages({
        'string.max': 'Category must not exceed 50 characters',
      }),
      variables: Joi.array().items(Joi.string()).optional(),
      status: Joi.string().valid('active', 'archived').optional().messages({
        'any.only': 'Status must be either active or archived',
      }),
    });

    const validationError = validateJoiSchema(schema, data);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    return { validatedData: data };
  }
}
