import { Injectable, HttpStatus } from '@nestjs/common';
import { validateJoiSchema } from '../../utils/joi.validator';
import { throwError } from '../../utils/util';
import { CreateWebhookDto, UpdateWebhookDto, ToggleWebhookStatusDto, WebhookFilterDto } from './dto/webhooks.dto';
import * as Joi from 'joi';

@Injectable()
export class WebhooksValidator {
  async validateCreateWebhook(data: CreateWebhookDto): Promise<{ validatedData: CreateWebhookDto }> {
    const schema = Joi.object({
      url: Joi.string().uri().required().messages({
        'string.uri': 'Invalid URL format',
        'any.required': 'Webhook URL is required',
      }),
      events: Joi.array().items(Joi.string()).min(1).required().messages({
        'array.min': 'At least one event type is required',
        'any.required': 'Events are required',
      }),
      status: Joi.string().valid('enabled', 'disabled').optional().default('enabled').messages({
        'any.only': 'Status must be either enabled or disabled',
      }),
    });

    const validationError = validateJoiSchema(schema, data);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    return { validatedData: data };
  }

  async validateUpdateWebhook(data: UpdateWebhookDto): Promise<{ validatedData: UpdateWebhookDto }> {
    const schema = Joi.object({
      url: Joi.string().uri().optional().messages({
        'string.uri': 'Invalid URL format',
      }),
      events: Joi.array().items(Joi.string()).min(1).optional().messages({
        'array.min': 'At least one event type is required',
      }),
      status: Joi.string().valid('enabled', 'disabled').optional().messages({
        'any.only': 'Status must be either enabled or disabled',
      }),
    });

    const validationError = validateJoiSchema(schema, data);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    return { validatedData: data };
  }

  async validateToggleWebhookStatus(data: ToggleWebhookStatusDto): Promise<{ validatedData: ToggleWebhookStatusDto }> {
    const schema = Joi.object({
      status: Joi.string().valid('enabled', 'disabled').required().messages({
        'any.only': 'Status must be either "enabled" or "disabled"',
        'any.required': 'Status is required',
      }),
    });

    const validationError = validateJoiSchema(schema, data);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    return { validatedData: data };
  }

  async validateGetWebhooksQuery(filter: WebhookFilterDto): Promise<{ validatedData: WebhookFilterDto }> {
    const schema = Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
      status: Joi.string().valid('enabled', 'disabled').optional(),
      eventType: Joi.string().valid('email.sent', 'email.delivered', 'email.opened', 'email.clicked', 'email.bounced').optional(),
    });

    const validationError = validateJoiSchema(schema, filter);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    return { validatedData: filter };
  }
}
