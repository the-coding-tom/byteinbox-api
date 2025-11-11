import { Injectable, HttpStatus } from '@nestjs/common';
import { validateJoiSchema } from '../../utils/joi.validator';
import { throwError } from '../../utils/util';
import { CreateTemplateDto, UpdateTemplateDto, RenderTemplateDto, TemplateFilterDto } from './dto/templates.dto';
import { TemplateUtil } from '../../utils/template.util';
import { TemplateRepository } from '../../repositories/template.repository';
import { TemplateVersionRepository } from '../../repositories/template-version.repository';
import { config } from '../../config/config';
import { TemplateVersionStatus } from '@prisma/client';
import * as Joi from 'joi';

@Injectable()
export class TemplatesValidator {
  constructor(
    private readonly templateRepository: TemplateRepository,
    private readonly templateVersionRepository: TemplateVersionRepository,
  ) {}
  async validateCreateTemplate(teamId: number, data: CreateTemplateDto): Promise<{ validatedData: CreateTemplateDto }> {
    const variableSchema = Joi.object({
      key: Joi.string().min(1).max(50).required().messages({
        'string.min': 'Variable key must be at least 1 character',
        'string.max': 'Variable key must not exceed 50 characters',
        'any.required': 'Variable key is required',
      }),
      type: Joi.string().valid('string', 'number', 'boolean', 'array', 'object').required().messages({
        'any.only': 'Variable type must be one of: string, number, boolean, array, object',
        'any.required': 'Variable type is required',
      }),
      fallbackValue: Joi.any().optional(),
    });

    const schema = Joi.object({
      name: Joi.string().min(1).max(100).required().messages({
        'string.min': 'Template name must be at least 1 character',
        'string.max': 'Template name must not exceed 100 characters',
        'any.required': 'Template name is required',
      }),
      html: Joi.string().min(1).required().messages({
        'string.min': 'HTML content must be at least 1 character',
        'any.required': 'HTML content is required',
      }),
      alias: Joi.string().min(1).max(100).optional().allow('').messages({
        'string.min': 'Alias must be at least 1 character',
        'string.max': 'Alias must not exceed 100 characters',
      }),
      description: Joi.string().max(500).optional().allow('').messages({
        'string.max': 'Description must not exceed 500 characters',
      }),
      subject: Joi.string().max(200).optional().allow('').messages({
        'string.max': 'Subject must not exceed 200 characters',
      }),
      category: Joi.string().max(50).optional().allow('').messages({
        'string.max': 'Category must not exceed 50 characters',
      }),
      from: Joi.string().email({ tlds: false }).optional().allow('').messages({
        'string.email': 'From must be a valid email address',
      }),
      replyTo: Joi.array().items(Joi.string().email({ tlds: false })).optional().messages({
        'string.email': 'Reply-to must be a valid email address',
        'array.base': 'Reply-to must be an array',
      }),
      text: Joi.string().optional().allow('').messages({
        'string.base': 'Text must be a string',
      }),
      variables: Joi.array().items(variableSchema).optional().messages({
        'array.base': 'Variables must be an array',
      }),
    });

    const validationError = validateJoiSchema(schema, data);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    // Validate template syntax
    const templateValidation = TemplateUtil.validateTemplate(data.html);
    if (!templateValidation.isValid) {
      throwError(
        `Invalid template syntax: ${templateValidation.error}`,
        HttpStatus.BAD_REQUEST,
        'templateSyntaxError'
      );
    }

    // Check if template name already exists for this team
    const existingTemplate = await this.templateRepository.findByNameAndTeam(data.name, teamId);
    if (existingTemplate) {
      throwError(
        `A template with the name "${data.name}" already exists for this team`,
        HttpStatus.CONFLICT,
        'templateNameExists'
      );
    }

    return { validatedData: data };
  }

  async validateRenderTemplate(data: RenderTemplateDto): Promise<{ validatedData: RenderTemplateDto }> {
    const schema = Joi.object({
      templateId: Joi.number().integer().positive().required().messages({
        'number.base': 'Template ID must be a number',
        'number.integer': 'Template ID must be an integer',
        'number.positive': 'Template ID must be positive',
        'any.required': 'Template ID is required',
      }),
      data: Joi.object().optional().default({}).messages({
        'object.base': 'Data must be an object',
      }),
    });

    const validationError = validateJoiSchema(schema, data);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    return { validatedData: data };
  }

  async validateGetTemplateDetails(templateId: string, teamId: number): Promise<{ template: any }> {
    const schema = Joi.object({
      templateId: Joi.string().required().messages({
        'any.required': 'Template ID is required',
      }),
    });

    const validationError = validateJoiSchema(schema, { templateId });
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    const template = await this.templateRepository.findByReference(templateId, teamId);
    if (!template) {
      throwError('Template not found', HttpStatus.NOT_FOUND, 'templateNotFound');
    }
    return { template };
  }

  async validateDeleteTemplate(templateId: string, teamId: number): Promise<{ template: any }> {
    const schema = Joi.object({
      templateId: Joi.string().required().messages({
        'any.required': 'Template ID is required',
      }),
    });

    const validationError = validateJoiSchema(schema, { templateId });
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    const template = await this.templateRepository.findByReference(templateId, teamId);
    if (!template) {
      throwError('Template not found', HttpStatus.NOT_FOUND, 'templateNotFound');
    }

    return { template };
  }

  async validateDuplicateTemplate(templateId: string, teamId: number): Promise<{ template: any }> {
    const schema = Joi.object({
      templateId: Joi.string().required().messages({
        'any.required': 'Template ID is required',
      }),
    });

    const validationError = validateJoiSchema(schema, { templateId });
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    const template = await this.templateRepository.findByReference(templateId, teamId);
    if (!template) {
      throwError('Template not found', HttpStatus.NOT_FOUND, 'templateNotFound');
    }

    return { template };
  }

  async validatePublishTemplate(templateId: string, teamId: number): Promise<{ templateId: number; versionId: number; template: any }> {
    const schema = Joi.object({
      templateId: Joi.string().required().messages({
        'any.required': 'Template ID is required',
      }),
    });

    const validationError = validateJoiSchema(schema, { templateId });
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    const template = await this.templateRepository.findByReference(templateId, teamId);
    if (!template) {
      throwError('Template not found', HttpStatus.NOT_FOUND, 'templateNotFound');
    }

    const latestVersion = await this.templateVersionRepository.findLatestVersionByTemplateReference(templateId, teamId);

    if (latestVersion.status !== TemplateVersionStatus.draft) {
      throwError('Template version is already published', HttpStatus.BAD_REQUEST, 'alreadyPublished');
    }

    return { templateId: latestVersion.template_id, versionId: latestVersion.version_id, template };
  }

  async validateGetTemplates(teamId: number, filter: TemplateFilterDto): Promise<{ validatedData: { teamId: number; filter: { keyword?: string; category?: string; status?: string; offset: number; limit: number } } }> {
    const schema = Joi.object({
      page: Joi.number().min(1).optional(),
      limit: Joi.number().min(1).max(config.validation.pagination.maxLimit).optional(),
      category: Joi.string().optional().allow(''),
      status: Joi.string().optional().allow(''),
      search: Joi.string().optional().allow(''),
    });

    const validationError = validateJoiSchema(schema, filter);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    const page = filter.page || config.validation.pagination.defaultPage;
    const limit = Math.min(filter.limit || config.validation.pagination.defaultLimit, config.validation.pagination.maxLimit);
    const offset = (page - 1) * limit;

    return {
      validatedData: {
        teamId,
        filter: {
          keyword: filter.search,
          category: filter.category,
          status: filter.status,
          offset,
          limit,
        },
      },
    };
  }

  async validateUpdateTemplateRequest(
    templateId: string,
    teamId: number,
    data: UpdateTemplateDto,
  ): Promise<{ validatedData: UpdateTemplateDto & { template: any } }> {
    const variableSchema = Joi.object({
      key: Joi.string().min(1).max(50).required().messages({
        'string.min': 'Variable key must be at least 1 character',
        'string.max': 'Variable key must not exceed 50 characters',
        'any.required': 'Variable key is required',
      }),
      type: Joi.string().valid('string', 'number', 'boolean', 'array', 'object').required().messages({
        'any.only': 'Variable type must be one of: string, number, boolean, array, object',
        'any.required': 'Variable type is required',
      }),
      fallbackValue: Joi.any().optional(),
    });

    const schema = Joi.object({
      name: Joi.string().min(1).max(100).optional().messages({
        'string.min': 'Template name must be at least 1 character',
        'string.max': 'Template name must not exceed 100 characters',
      }),
      description: Joi.string().max(500).optional().allow('').messages({
        'string.max': 'Description must not exceed 500 characters',
      }),
      alias: Joi.string().min(1).max(100).optional().allow('').messages({
        'string.min': 'Alias must be at least 1 character',
        'string.max': 'Alias must not exceed 100 characters',
      }),
      from: Joi.string().email({ tlds: false }).optional().allow('').messages({
        'string.email': 'From must be a valid email address',
      }),
      subject: Joi.string().max(200).optional().allow('').messages({
        'string.max': 'Subject must not exceed 200 characters',
      }),
      replyTo: Joi.array().items(Joi.string().email({ tlds: false })).optional().messages({
        'string.email': 'Reply-to must be a valid email address',
        'array.base': 'Reply-to must be an array',
      }),
      html: Joi.string().min(1).optional().messages({
        'string.min': 'HTML content must be at least 1 character',
      }),
      text: Joi.string().optional().allow('').messages({
        'string.base': 'Text must be a string',
      }),
      variables: Joi.array().items(variableSchema).optional().messages({
        'array.base': 'Variables must be an array',
      }),
    });

    const validationError = validateJoiSchema(schema, data);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    // Validate template syntax if HTML is being updated
    if (data.html) {
      const templateValidation = TemplateUtil.validateTemplate(data.html);
      if (!templateValidation.isValid) {
        throwError(
          `Invalid template syntax: ${templateValidation.error}`,
          HttpStatus.BAD_REQUEST,
          'templateSyntaxError'
        );
      }
    }

    const template = await this.templateRepository.findByReference(templateId, teamId);
    if (!template) {
      throwError('Template not found', HttpStatus.NOT_FOUND, 'templateNotFound');
    }
    return {
      validatedData: {
        ...data,
        name: data.name ?? template.name,
        description: data.description !== undefined ? data.description : template.description,
        html: data.html ?? template.html,
        template,
      },
    };
  }

}
