import { Injectable, HttpStatus } from '@nestjs/common';
import { validateJoiSchema } from '../../utils/joi.validator';
import { throwError } from '../../utils/util';
import { CreateBroadcastDto, UpdateBroadcastDto, AutoSaveBroadcastDto, SendTestBroadcastDto, BroadcastFilterDto, SendBroadcastDto } from './dto/broadcasts.dto';
import { AudienceRepository } from '../../repositories/audience.repository';
import { BroadcastRepository } from '../../repositories/broadcast.repository';
import * as Joi from 'joi';
import * as moment from 'moment';

@Injectable()
export class BroadcastsValidator {
  constructor(
    private readonly audienceRepository: AudienceRepository,
    private readonly broadcastRepository: BroadcastRepository,
  ) {}

  async validateCreateBroadcast(data: CreateBroadcastDto, teamId: number): Promise<{ validatedData: CreateBroadcastDto; audienceId: number }> {
    const schema = Joi.object({
      audienceId: Joi.string().required().messages({
        'any.required': 'Audience ID is required',
        'string.empty': 'Audience ID cannot be empty',
      }),
      from: Joi.string().email().required().messages({
        'any.required': 'From address is required',
        'string.empty': 'From address cannot be empty',
        'string.email': 'From address must be a valid email (can include friendly name: "Name <email@example.com>")',
      }),
      subject: Joi.string().min(1).max(200).required().messages({
        'string.min': 'Subject must be at least 1 character',
        'string.max': 'Subject must not exceed 200 characters',
        'any.required': 'Subject is required',
      }),
      replyTo: Joi.array().items(Joi.string().email()).optional().messages({
        'array.base': 'Reply-to must be an array of email addresses',
        'string.email': 'Each reply-to address must be a valid email',
      }),
      html: Joi.string().optional(),
      text: Joi.string().allow('').optional(),
      name: Joi.string().min(1).max(100).optional().messages({
        'string.min': 'Campaign name must be at least 1 character',
        'string.max': 'Campaign name must not exceed 100 characters',
      }),
      scheduledAt: Joi.date().iso().optional().messages({
        'date.format': 'Scheduled date must be in ISO format',
      }),
    })
      .custom((value, helpers) => {
        // Either html or text must be provided
        if (!value.html && !value.text) {
          return helpers.error('custom.htmlOrTextRequired');
        }
        return value;
      })
      .messages({
        'custom.htmlOrTextRequired': 'Either html or text content must be provided',
      });

    const validationError = validateJoiSchema(schema, data);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    // Verify audience exists and belongs to team
    const audience = await this.audienceRepository.findByReference(data.audienceId, teamId);
    if (!audience) {
      throwError('Audience not found', HttpStatus.NOT_FOUND, 'audienceNotFound');
      throw new Error('Audience not found'); // TypeScript safety - never reached
    }

    const audienceId = typeof audience.id === 'number' ? audience.id : parseInt(audience.id.toString());

    return { validatedData: data, audienceId };
  }

  async validateUpdateBroadcast(data: UpdateBroadcastDto & { broadcastId: string }, teamId: number): Promise<{ validatedData: UpdateBroadcastDto; audienceId?: number; broadcast: any }> {
    const schema = Joi.object({
      broadcastId: Joi.string().required().messages({
        'any.required': 'Broadcast ID is required',
        'string.empty': 'Broadcast ID cannot be empty',
      }),
      audienceId: Joi.string().optional(),
      from: Joi.string().email().optional().messages({
        'string.email': 'From address must be a valid email',
      }),
      subject: Joi.string().min(1).max(200).optional().messages({
        'string.min': 'Subject must be at least 1 character',
        'string.max': 'Subject must not exceed 200 characters',
      }),
      replyTo: Joi.array().items(Joi.string().email()).optional().messages({
        'array.base': 'Reply-to must be an array of email addresses',
        'string.email': 'Each reply-to address must be a valid email',
      }),
      html: Joi.string().optional(),
      text: Joi.string().allow('').optional(),
      name: Joi.string().min(1).max(100).optional().messages({
        'string.min': 'Campaign name must be at least 1 character',
        'string.max': 'Campaign name must not exceed 100 characters',
      }),
      scheduledAt: Joi.date().iso().optional().messages({
        'date.format': 'Scheduled date must be in ISO format',
      }),
    });

    const validationError = validateJoiSchema(schema, data);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    // Verify broadcast exists and belongs to team
    const broadcast = await this.broadcastRepository.findByReference(data.broadcastId, teamId);
    if (!broadcast) {
      throwError('Broadcast not found', HttpStatus.NOT_FOUND, 'broadcastNotFound');
      throw new Error('Broadcast not found'); // TypeScript safety - never reached
    }

    // If audienceId is being updated, verify it exists and belongs to team
    let audienceId: number | undefined;
    if (data.audienceId) {
      const audience = await this.audienceRepository.findByReference(data.audienceId, teamId);
      if (!audience) {
        throwError('Audience not found', HttpStatus.NOT_FOUND, 'audienceNotFound');
        throw new Error('Audience not found'); // TypeScript safety - never reached
      }
      audienceId = typeof audience.id === 'number' ? audience.id : parseInt(audience.id.toString());
    }

    return { validatedData: data, audienceId, broadcast };
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

  async validateGetBroadcastDetails(broadcastId: string, teamId: number): Promise<{ broadcast: any }> {
    // Validate broadcastId format
    const schema = Joi.object({
      broadcastId: Joi.string().required().messages({
        'any.required': 'Broadcast ID is required',
        'string.empty': 'Broadcast ID cannot be empty',
      }),
    });

    const validationError = validateJoiSchema(schema, { broadcastId });
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    // Fetch broadcast from database
    const broadcast = await this.broadcastRepository.findByReference(broadcastId, teamId);
    if (!broadcast) {
      throwError('Broadcast not found', HttpStatus.NOT_FOUND, 'broadcastNotFound');
      throw new Error('Broadcast not found'); // TypeScript safety - never reached
    }

    return { broadcast };
  }

  async validateDeleteBroadcast(broadcastId: string, teamId: number): Promise<{ broadcast: any }> {
    // Validate broadcastId format
    const schema = Joi.object({
      broadcastId: Joi.string().required().messages({
        'any.required': 'Broadcast ID is required',
        'string.empty': 'Broadcast ID cannot be empty',
      }),
    });

    const validationError = validateJoiSchema(schema, { broadcastId });
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    // Fetch broadcast from database
    const broadcast = await this.broadcastRepository.findByReference(broadcastId, teamId);
    if (!broadcast) {
      throwError('Broadcast not found', HttpStatus.NOT_FOUND, 'broadcastNotFound');
      throw new Error('Broadcast not found'); // TypeScript safety - never reached
    }

    return { broadcast };
  }

  async validateSendBroadcast(data: SendBroadcastDto, broadcastId: string, teamId: number): Promise<{ validatedData: SendBroadcastDto; scheduledAt?: Date; broadcast: any }> {
    // Validate broadcastId format
    const idSchema = Joi.object({
      broadcastId: Joi.string().required().messages({
        'any.required': 'Broadcast ID is required',
        'string.empty': 'Broadcast ID cannot be empty',
      }),
    });

    const idValidationError = validateJoiSchema(idSchema, { broadcastId });
    if (idValidationError) {
      throwError(idValidationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    const schema = Joi.object({
      scheduledAt: Joi.string().optional().messages({
        'string.base': 'Scheduled time must be a string',
      }),
    });

    const validationError = validateJoiSchema(schema, data);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    // Verify broadcast exists and belongs to team
    const broadcast = await this.broadcastRepository.findByReference(broadcastId, teamId);
    if (!broadcast) {
      throwError('Broadcast not found', HttpStatus.NOT_FOUND, 'broadcastNotFound');
      throw new Error('Broadcast not found'); // TypeScript safety - never reached
    }

    // Check if broadcast is in draft status
    if (broadcast.status !== 'draft') {
      throwError('Only draft broadcasts can be sent', HttpStatus.BAD_REQUEST, 'invalidBroadcastStatus');
      throw new Error('Invalid broadcast status'); // TypeScript safety - never reached
    }

    // Parse scheduledAt if provided
    let scheduledAt: Date | undefined;
    if (data.scheduledAt) {
      // Handle relative time like "in 1 min"
      const parsedMoment = moment(data.scheduledAt, [
        moment.ISO_8601,
        'YYYY-MM-DD HH:mm:ss',
      ]);

      // Check if it's a relative time string
      if (data.scheduledAt.startsWith('in ')) {
        const match = data.scheduledAt.match(/^in (\d+) (min|minute|minutes|hour|hours|day|days)$/);
        if (!match) {
          throwError('Invalid scheduled_at format. Use "in X min/hour/day" or ISO date', HttpStatus.BAD_REQUEST, 'validationError');
          throw new Error('Invalid scheduled_at format'); // TypeScript safety - never reached
        }
        const amount = match[1];
        const unit = match[2];
        const value = parseInt(amount);

        if (unit.startsWith('min')) {
          scheduledAt = moment().add(value, 'minutes').toDate();
        } else if (unit.startsWith('hour')) {
          scheduledAt = moment().add(value, 'hours').toDate();
        } else if (unit.startsWith('day')) {
          scheduledAt = moment().add(value, 'days').toDate();
        }
      } else if (parsedMoment.isValid()) {
        scheduledAt = parsedMoment.toDate();
      } else {
        throwError('Invalid scheduled_at date format', HttpStatus.BAD_REQUEST, 'validationError');
        throw new Error('Invalid scheduled_at date format'); // TypeScript safety - never reached
      }

      // Ensure scheduled time is in the future
      if (scheduledAt && scheduledAt <= new Date()) {
        throwError('Scheduled time must be in the future', HttpStatus.BAD_REQUEST, 'validationError');
      }
    }

    return { validatedData: data, scheduledAt, broadcast };
  }
}
