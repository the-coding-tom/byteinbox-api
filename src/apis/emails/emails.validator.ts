import { Injectable, HttpStatus } from '@nestjs/common';
import { validateJoiSchema } from '../../utils/joi.validator';
import { throwError } from '../../utils/util';
import { SendEmailDto, EmailFilterDto } from './dto/emails.dto';
import { extractDomainFromEmail } from '../../utils/email.util';
import { DomainRepository } from '../../repositories/domain.repository';
import { EmailRepository } from '../../repositories/email.repository';
import { TemplateRepository } from '../../repositories/template.repository';
import { DomainStatus } from '@prisma/client';
import { EmailStatus } from '../../common/enums/generic.enum';
import * as Joi from 'joi';

@Injectable()
export class EmailsValidator {
  constructor(
    private readonly domainRepository: DomainRepository,
    private readonly emailRepository: EmailRepository,
    private readonly templateRepository: TemplateRepository,
  ) {}

  async validateSendEmail(data: SendEmailDto, teamId: number): Promise<{ validatedData: SendEmailDto; domain: any; templateId?: number }> {
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
      template: Joi.string().optional(),
      variables: Joi.object().optional(),
    })
      .custom((value, helpers) => {
        // Ensure either text, html, or template is provided
        if (!value.text && !value.html && !value.template) {
          return helpers.error('custom.textOrHtmlOrTemplateRequired');
        }

        // Ensure html and text are not provided when template is used
        if (value.template && (value.html || value.text)) {
          return helpers.error('custom.htmlOrTextWithTemplate');
        }

        return value;
      })
      .messages({
        'custom.textOrHtmlOrTemplateRequired': 'Either text, html, or template must be provided',
        'custom.htmlOrTextWithTemplate': 'Cannot provide html or text when using a template. The template will provide the content.',
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

    // Validate template if provided and return templateId
    let templateId: number | undefined;
    if (data.template) {
      const template = await this.templateRepository.findByNameOrReference(data.template, teamId);
      if (!template) {
        throwError(
          `Template '${data.template}' not found.`,
          HttpStatus.BAD_REQUEST,
          'validationError',
        );
      }

      if (!template.CurrentVersion) {
        throwError(
          `Template '${data.template}' has no published version.`,
          HttpStatus.BAD_REQUEST,
          'validationError',
        );
      }

      templateId = template.id;
    }

    return { validatedData: data, domain, templateId };
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

  async validateSendBatchEmail(data: any): Promise<{ validatedData: any }> {
    // Attachment schema (same as in validateSendEmail)
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

    // Single email schema (same as in validateSendEmail)
    const emailSchema = Joi.object({
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
      template: Joi.string().optional(),
      variables: Joi.object().optional(),
    })
      .custom((value, helpers) => {
        // Ensure either text, html, or template is provided
        if (!value.text && !value.html && !value.template) {
          return helpers.error('custom.textOrHtmlOrTemplateRequired');
        }

        // Ensure html and text are not provided when template is used
        if (value.template && (value.html || value.text)) {
          return helpers.error('custom.htmlOrTextWithTemplate');
        }

        return value;
      })
      .messages({
        'custom.textOrHtmlOrTemplateRequired': 'Either text, html, or template must be provided',
        'custom.htmlOrTextWithTemplate': 'Cannot provide html or text when using a template. The template will provide the content.',
        'custom.contentOrPathRequired': 'Either content or path must be provided for attachment',
      });

    // Batch schema - array of email objects
    const batchSchema = Joi.array()
      .items(emailSchema)
      .min(1)
      .max(100)
      .required()
      .messages({
        'any.required': 'Emails array is required',
        'array.base': 'Request body must be an array of email objects',
        'array.min': 'At least one email is required',
        'array.max': 'Maximum 100 emails allowed per batch',
      });

    const validationError = validateJoiSchema(batchSchema, data);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    return { validatedData: data };
  }

  async validateUpdateScheduledEmail(reference: string, data: any, teamId: number): Promise<{ validatedData: any }> {
    // Schema validation
    const schema = Joi.object({
      scheduledAt: Joi.string().isoDate().required().messages({
        'any.required': 'scheduledAt is required',
        'string.isoDate': 'scheduledAt must be a valid ISO 8601 date string',
      }),
    });

    const validationError = validateJoiSchema(schema, data);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    // Check if email exists and has scheduled status
    const email = await this.emailRepository.findById(
      await this.emailRepository.findByReference(reference).then(e => e?.id)
    );

    if (!email) {
      throwError('Email not found', HttpStatus.NOT_FOUND, 'notFound');
    }

    if (email.teamId !== teamId) {
      throwError('Email not found', HttpStatus.NOT_FOUND, 'notFound');
    }

    // Check if email has any recipients with scheduled status
    const hasScheduledRecipients = email.recipients?.some((r: any) => r.status === 'scheduled');
    if (!hasScheduledRecipients) {
      throwError('Email is not in scheduled status', HttpStatus.BAD_REQUEST, 'validationError');
    }

    return { validatedData: data };
  }

  async validateCancelScheduledEmail(reference: string, teamId: number): Promise<void> {
    // Check if email exists and has scheduled status
    const email = await this.emailRepository.findById(
      await this.emailRepository.findByReference(reference).then(e => e?.id)
    );

    if (!email) {
      throwError('Email not found', HttpStatus.NOT_FOUND, 'notFound');
    }

    if (email.teamId !== teamId) {
      throwError('Email not found', HttpStatus.NOT_FOUND, 'notFound');
    }

    // Check if email has any recipients with scheduled status
    const hasScheduledRecipients = email.recipients?.some((r: any) => r.status === 'scheduled');
    if (!hasScheduledRecipients) {
      throwError('Email is not in scheduled status', HttpStatus.BAD_REQUEST, 'validationError');
    }
  }

  async validateGetAttachment(attachmentReference: string, emailReference: string, teamId: number): Promise<void> {
    // Schema validation
    const schema = Joi.object({
      attachmentReference: Joi.string().min(1).required().messages({
        'any.required': 'Attachment reference is required',
        'string.empty': 'Attachment reference cannot be empty',
      }),
      emailReference: Joi.string().min(1).required().messages({
        'any.required': 'Email reference is required',
        'string.empty': 'Email reference cannot be empty',
      }),
    });

    const validationError = validateJoiSchema(schema, { attachmentReference, emailReference });
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    // Check if attachment exists for the email and team
    const attachment = await this.emailRepository.findAttachmentByReference(
      attachmentReference,
      emailReference,
      teamId
    );

    if (!attachment) {
      throwError('Attachment not found', HttpStatus.NOT_FOUND, 'notFound');
    }
  }

  async validateGetAttachments(emailReference: string, teamId: number): Promise<void> {
    // Schema validation
    const schema = Joi.object({
      emailReference: Joi.string().min(1).required().messages({
        'any.required': 'Email reference is required',
        'string.empty': 'Email reference cannot be empty',
      }),
    });

    const validationError = validateJoiSchema(schema, { emailReference });
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    // Check if email exists and user has access
    const email = await this.emailRepository.findById(
      await this.emailRepository.findByReference(emailReference).then(e => e?.id)
    );

    if (!email) {
      throwError('Email not found', HttpStatus.NOT_FOUND, 'notFound');
    }

    if (email.teamId !== teamId) {
      throwError('Email not found', HttpStatus.NOT_FOUND, 'notFound');
    }
  }
}
