import { Injectable, HttpStatus } from '@nestjs/common';
import { validateJoiSchema } from '../../utils/joi.validator';
import { throwError } from '../../utils/util';
import { SendEmailDto, EmailFilterDto } from './dto/emails.dto';
import { extractDomainFromEmail } from '../../utils/email.util';
import { DomainRepository } from '../../repositories/domain.repository';
import { EmailRepository } from '../../repositories/email.repository';
import { DomainStatus } from '@prisma/client';
import { EmailStatus } from '../../common/enums/generic.enum';
import * as Joi from 'joi';

@Injectable()
export class EmailsValidator {
  constructor(
    private readonly domainRepository: DomainRepository,
    private readonly emailRepository: EmailRepository,
  ) {}

  async validateSendEmail(data: SendEmailDto, teamId: number): Promise<{ validatedData: SendEmailDto; domain: any }> {
    // Attachment schema
    const attachmentSchema = Joi.object({
      content: Joi.alternatives().try(Joi.string().base64(), Joi.binary()).optional(),
      filename: Joi.string().required(),
      path: Joi.string().uri().optional(),
      contentType: Joi.string().optional(),
      contentId: Joi.string().optional(),
    }).custom((value, helpers) => {
      if (!value.content && !value.path) {
        return helpers.error('custom.contentOrPathRequired');
      }
      if (Buffer.isBuffer(value.content)) {
        value.content = value.content.toString('base64');
      }
      return value;
    });

    // Send email schema
    const schema = Joi.object({
      from: Joi.string().email().required().messages({
        'any.required': 'From address is required',
        'string.empty': 'From address cannot be empty',
        'string.email': 'From address must be a valid email',
      }),
      to: Joi.array()
        .items(Joi.string().email())
        .min(1)
        .max(50)
        .required()
        .messages({
          'any.required': 'To field is required',
          'array.base': 'To must be an array of email addresses',
          'array.min': 'At least one recipient is required',
          'array.max': 'Maximum 50 recipients allowed',
        }),
      subject: Joi.string().min(1).max(200).required().messages({
        'any.required': 'Subject is required',
        'string.min': 'Subject must be at least 1 character',
        'string.max': 'Subject must not exceed 200 characters',
      }),

      cc: Joi.array().items(Joi.string().email()).optional().messages({
        'array.base': 'CC must be an array of email addresses',
      }),
      bcc: Joi.array().items(Joi.string().email()).optional().messages({
        'array.base': 'BCC must be an array of email addresses',
      }),
      replyTo: Joi.array().items(Joi.string().email()).optional().messages({
        'array.base': 'Reply-to must be an array of email addresses',
      }),

      text: Joi.string().allow('').optional(),
      html: Joi.string().optional(),
      scheduledAt: Joi.string().optional(),
      headers: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
      attachments: Joi.array().items(attachmentSchema).optional(),
      templateId: Joi.string().optional(),
      variables: Joi.object().optional(),
    })
      .custom((value, helpers) => {
        if (!value.text && !value.html && !value.templateId) {
          return helpers.error('custom.textOrHtmlRequired');
        }
        return value;
      })
      .messages({
        'custom.textOrHtmlRequired': 'Either text, html, or templateId must be provided',
        'custom.contentOrPathRequired': 'Either content or path must be provided for attachment',
      });

    // Validate send email schema
    const validationError = validateJoiSchema(schema, data);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    // Extract and validate domain from 'from' address
    const extractedDomain = extractDomainFromEmail(data.from);
    if (!extractedDomain) {
      throwError('Invalid from address format', HttpStatus.BAD_REQUEST, 'validationError');
    }

    // Look up and validate domain
    const domain = await this.domainRepository.findByTeamIdAndName(teamId, extractedDomain as string);
    if (!domain) {
      throwError(
        `Domain '${extractedDomain}' not found. Please add and verify it first.`,
        HttpStatus.BAD_REQUEST,
        'validationError',
      );
    }

    // Validate domain status is verified and active
    if (domain.status !== DomainStatus.verified) {
      throwError(
        `Domain '${extractedDomain}' is not verified. Current status: ${domain.status}.`,
        HttpStatus.BAD_REQUEST,
        'validationError',
      );
    }

    return { validatedData: data, domain };
  }

  async validateGetEmailsQuery(filter: EmailFilterDto): Promise<{ validatedData: EmailFilterDto }> {
    const schema = Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
      status: Joi.string().valid(...Object.values(EmailStatus)).optional(),
      startDate: Joi.date().iso().optional(),
      endDate: Joi.date().iso().optional(),
      keyword: Joi.string().min(1).max(100).optional(),
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

  async validateEmailAccess(emailReference: string, teamId: number): Promise<any> {
    const schema = Joi.object({
      emailReference: Joi.string().min(1).required().messages({
        'any.required': 'Email reference is required',
        'string.empty': 'Email reference cannot be empty',
        'string.min': 'Email reference must be at least 1 character',
      }),
      teamId: Joi.number().integer().positive().required().messages({
        'any.required': 'Team ID is required',
        'number.base': 'Team ID must be a number',
        'number.integer': 'Team ID must be an integer',
        'number.positive': 'Team ID must be a positive number',
      }),
    });

    const validationError = validateJoiSchema(schema, { emailReference, teamId });
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    const email = await this.emailRepository.findByReference(emailReference);

    if (!email) {
      throwError('Email not found', HttpStatus.NOT_FOUND, 'notFound');
    }

    if (email.teamId !== teamId) {
      throwError('Email not found', HttpStatus.NOT_FOUND, 'notFound');
    }

    return email;
  }
}
