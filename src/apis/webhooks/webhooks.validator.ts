import { Injectable, HttpStatus } from '@nestjs/common';
import { validateJoiSchema } from '../../utils/joi.validator';
import { throwError } from '../../utils/util';
import { CreateWebhookDto, UpdateWebhookDto, ToggleWebhookStatusDto } from './dto/webhooks.dto';
import { WebhookEventType } from '../../common/enums/generic.enum';
import { WebhookRepository } from '../../repositories/webhook.repository';
import { WebhookDetailsData } from '../../repositories/entities/webhook.entity';
import * as Joi from 'joi';

@Injectable()
export class WebhooksValidator {
  constructor(private readonly webhookRepository: WebhookRepository) {}
  async validateCreateWebhook(teamId: number, userId: number, data: CreateWebhookDto): Promise<{ validatedData: { teamId: number; userId: number; endpoint: string; events: string[] } }> {
    const schema = Joi.object({
      endpoint: Joi.string().uri().required().messages({
        'string.uri': 'Invalid URL format',
        'any.required': 'Webhook endpoint is required',
      }),
      events: Joi.array().items(Joi.string().valid(...Object.values(WebhookEventType))).min(1).required().messages({
        'array.min': 'At least one event type is required',
        'any.required': 'Events are required',
        'any.only': 'Invalid event type',
      }),
    });

    const validationError = validateJoiSchema(schema, data);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    // Validate teamId
    if (!teamId || teamId <= 0) {
      throwError('Invalid team ID', HttpStatus.BAD_REQUEST, 'validationError');
    }

    // Validate userId
    if (!userId || userId <= 0) {
      throwError('Invalid user ID', HttpStatus.BAD_REQUEST, 'validationError');
    }

    return { validatedData: { teamId, userId, endpoint: data.endpoint, events: data.events } };
  }

  async validateUpdateWebhook(teamId: number, webhookId: string, data: UpdateWebhookDto): Promise<{ validatedData: { teamId: number; webhookId: string; webhook: WebhookDetailsData; endpoint?: string; events?: string[]; status?: string } }> {
    const schema = Joi.object({
      endpoint: Joi.string().uri().optional().messages({
        'string.uri': 'Invalid URL format',
      }),
      events: Joi.array().items(Joi.string().valid(...Object.values(WebhookEventType))).min(1).optional().messages({
        'array.min': 'At least one event type is required',
        'any.only': 'Invalid event type',
      }),
      status: Joi.string().valid('enabled', 'disabled').optional().messages({
        'any.only': 'Status must be either enabled or disabled',
      }),
    });

    const validationError = validateJoiSchema(schema, data);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    // Validate teamId
    if (!teamId || teamId <= 0) {
      throwError('Invalid team ID', HttpStatus.BAD_REQUEST, 'validationError');
    }

    // Validate webhookId
    if (!webhookId) {
      throwError('Webhook ID is required', HttpStatus.BAD_REQUEST, 'validationError');
    }

    // Fetch and validate webhook exists
    const webhook = await this.webhookRepository.findByReference(webhookId, teamId);
    if (!webhook) {
      throwError('Webhook not found', HttpStatus.NOT_FOUND, 'notFound');
    }

    return {
      validatedData: {
        teamId,
        webhookId,
        webhook: webhook!,
        endpoint: data.endpoint,
        events: data.events,
        status: data.status
      }
    };
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

  async validateGetWebhooks(teamId: number): Promise<{ validatedData: { teamId: number } }> {
    // Validate teamId
    if (!teamId || teamId <= 0) {
      throwError('Invalid team ID', HttpStatus.BAD_REQUEST, 'validationError');
    }

    return { validatedData: { teamId } };
  }

  async validateGetWebhookDetails(teamId: number, webhookId: string): Promise<{ validatedData: { teamId: number; webhookId: string; webhook: WebhookDetailsData } }> {
    const schema = Joi.object({
      webhookId: Joi.string().required().messages({
        'any.required': 'Webhook ID is required',
      }),
    });

    const validationError = validateJoiSchema(schema, { webhookId });
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    // Validate teamId
    if (!teamId || teamId <= 0) {
      throwError('Invalid team ID', HttpStatus.BAD_REQUEST, 'validationError');
    }

    // Fetch and validate webhook exists
    const webhook = await this.webhookRepository.findByReference(webhookId, teamId);
    if (!webhook) {
      throwError('Webhook not found', HttpStatus.NOT_FOUND, 'notFound');
    }

    return { validatedData: { teamId, webhookId, webhook: webhook! } };
  }

  async validateDeleteWebhook(teamId: number, webhookId: string): Promise<{ validatedData: { teamId: number; webhookId: string; webhook: WebhookDetailsData } }> {
    const schema = Joi.object({
      webhookId: Joi.string().required().messages({
        'any.required': 'Webhook ID is required',
      }),
    });

    const validationError = validateJoiSchema(schema, { webhookId });
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    // Validate teamId
    if (!teamId || teamId <= 0) {
      throwError('Invalid team ID', HttpStatus.BAD_REQUEST, 'validationError');
    }

    // Fetch and validate webhook exists
    const webhook = await this.webhookRepository.findByReference(webhookId, teamId);
    if (!webhook) {
      throwError('Webhook not found', HttpStatus.NOT_FOUND, 'notFound');
    }

    return { validatedData: { teamId, webhookId, webhook: webhook! } };
  }
}
