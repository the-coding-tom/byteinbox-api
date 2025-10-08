import { Injectable, HttpStatus } from '@nestjs/common';
import { validateJoiSchema } from '../../utils/joi.validator';
import { throwError } from '../../utils/util';
import { SendEmailDto, EmailFilterDto } from './dto/emails.dto';
import * as Joi from 'joi';

@Injectable()
export class EmailsValidator {
  async validateSendEmail(data: SendEmailDto): Promise<{ validatedData: SendEmailDto }> {
    const schema = Joi.object({
      to: Joi.array().items(Joi.string().email()).min(1).required().messages({
        'array.min': 'At least one recipient is required',
        'any.required': 'Recipients are required',
      }),
      cc: Joi.array().items(Joi.string().email()).optional(),
      bcc: Joi.array().items(Joi.string().email()).optional(),
      replyTo: Joi.array().items(Joi.string().email()).optional(),
      subject: Joi.string().min(1).max(200).required().messages({
        'string.min': 'Subject must be at least 1 character',
        'string.max': 'Subject must not exceed 200 characters',
        'any.required': 'Subject is required',
      }),
      text: Joi.string().optional(),
      html: Joi.string().optional(),
      from: Joi.string().email().optional(),
      domainId: Joi.string().optional(),
      templateId: Joi.string().optional(),
      variables: Joi.object().optional(),
      attachments: Joi.array().items(
        Joi.object({
          filename: Joi.string().required(),
          content: Joi.string().required(),
          type: Joi.string().optional(),
        })
      ).optional(),
    }).custom((value, helpers) => {
      // At least one of text or html must be provided
      if (!value.text && !value.html && !value.templateId) {
        return helpers.error('custom.textOrHtmlRequired');
      }
      return value;
    }).messages({
      'custom.textOrHtmlRequired': 'Either text, html, or templateId must be provided',
    });

    const validationError = validateJoiSchema(schema, data);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    return { validatedData: data };
  }

  async validateGetEmailsQuery(filter: EmailFilterDto): Promise<{ validatedData: EmailFilterDto }> {
    const schema = Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
      status: Joi.string().valid('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed').optional(),
      startDate: Joi.date().iso().optional(),
      endDate: Joi.date().iso().optional(),
      recipient: Joi.string().email().optional(),
      keyword: Joi.string().min(1).max(100).optional(),
      timeRange: Joi.string().valid('1d', '3d', '7d', '30d', '90d').optional(),
    });

    const validationError = validateJoiSchema(schema, filter);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    return { validatedData: filter };
  }

  async validateGetEmailStatsQuery(filter: EmailFilterDto): Promise<{ validatedData: EmailFilterDto }> {
    const schema = Joi.object({
      startDate: Joi.date().iso().optional(),
      endDate: Joi.date().iso().optional(),
      timeRange: Joi.string().valid('1d', '3d', '7d', '30d', '90d').optional(),
    });

    const validationError = validateJoiSchema(schema, filter);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    return { validatedData: filter };
  }
}
