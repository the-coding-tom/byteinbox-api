import { Injectable, HttpStatus } from '@nestjs/common';
import { validateJoiSchema } from '../../utils/joi.validator';
import { throwError } from '../../utils/util';
import { CreateTemplateDto, UpdateTemplateDto, RenderTemplateDto } from './dto/templates.dto';
import { TemplateRepository } from '../../repositories/template.repository';
import { TemplateUtil } from '../../utils/template.util';
import * as Joi from 'joi';

@Injectable()
export class TemplatesValidator {
  constructor(private readonly templateRepository: TemplateRepository) {}
  async validateCreateTemplate(data: CreateTemplateDto): Promise<{ validatedData: CreateTemplateDto }> {
    const schema = Joi.object({
      name: Joi.string().min(1).max(100).required().messages({
        'string.min': 'Template name must be at least 1 character',
        'string.max': 'Template name must not exceed 100 characters',
        'any.required': 'Template name is required',
      }),
      description: Joi.string().max(500).optional().allow('').messages({
        'string.max': 'Description must not exceed 500 characters',
      }),
      html: Joi.string().min(1).required().messages({
        'string.min': 'HTML content must be at least 1 character',
        'any.required': 'HTML content is required',
      }),
      subject: Joi.string().max(200).optional().allow('').messages({
        'string.max': 'Subject must not exceed 200 characters',
      }),
      category: Joi.string().max(50).optional().allow('').messages({
        'string.max': 'Category must not exceed 50 characters',
      }),
      variables: Joi.array().items(Joi.string().min(1).max(50)).optional().messages({
        'array.base': 'Variables must be an array',
        'string.min': 'Variable names must be at least 1 character',
        'string.max': 'Variable names must not exceed 50 characters',
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

    // Auto-extract variables if not provided
    if (!data.variables || data.variables.length === 0) {
      data.variables = TemplateUtil.extractVariables(data.html);
    }

    return { validatedData: data };
  }

  async validateUpdateTemplate(data: UpdateTemplateDto): Promise<{ validatedData: UpdateTemplateDto }> {
    const schema = Joi.object({
      name: Joi.string().min(1).max(100).optional().messages({
        'string.min': 'Template name must be at least 1 character',
        'string.max': 'Template name must not exceed 100 characters',
      }),
      description: Joi.string().max(500).optional().allow('').messages({
        'string.max': 'Description must not exceed 500 characters',
      }),
      html: Joi.string().min(1).optional().messages({
        'string.min': 'HTML content must be at least 1 character',
      }),
      subject: Joi.string().max(200).optional().allow('').messages({
        'string.max': 'Subject must not exceed 200 characters',
      }),
      category: Joi.string().max(50).optional().allow('').messages({
        'string.max': 'Category must not exceed 50 characters',
      }),
      variables: Joi.array().items(Joi.string().min(1).max(50)).optional().messages({
        'array.base': 'Variables must be an array',
        'string.min': 'Variable names must be at least 1 character',
        'string.max': 'Variable names must not exceed 50 characters',
      }),
      status: Joi.string().valid('active', 'archived').optional().messages({
        'any.only': 'Status must be either active or archived',
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

      // Auto-extract variables if HTML is updated and variables not provided
      if (!data.variables) {
        data.variables = TemplateUtil.extractVariables(data.html);
      }
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

  async validateTemplateId(templateId: string): Promise<{ validatedTemplateId: number }> {
    const schema = Joi.object({
      templateId: Joi.string().pattern(/^\d+$/).required().messages({
        'string.pattern.base': 'Template ID must be a valid number',
        'any.required': 'Template ID is required',
      }),
    });

    const validationError = validateJoiSchema(schema, { templateId });
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    return { validatedTemplateId: parseInt(templateId, 10) };
  }

  // Endpoint-specific combined validators following project pattern
  async validateGetTemplateDetails(templateId: string, teamId: number): Promise<{ template: any }> {
    const { validatedTemplateId } = await this.validateTemplateId(templateId);
    const template = await this.templateRepository.findById(validatedTemplateId, teamId);
    if (!template) {
      throwError('Template not found', HttpStatus.NOT_FOUND, 'templateNotFound');
    }
    return { template };
  }

  async validateUpdateTemplateRequest(
    templateId: string,
    teamId: number,
    data: UpdateTemplateDto,
  ): Promise<{ validatedData: UpdateTemplateDto; templateId: number; template: any }> {
    const { validatedTemplateId } = await this.validateTemplateId(templateId);
    const { validatedData } = await this.validateUpdateTemplate(data);
    const template = await this.templateRepository.findById(validatedTemplateId, teamId);
    if (!template) {
      throwError('Template not found', HttpStatus.NOT_FOUND, 'templateNotFound');
    }
    return { validatedData, templateId: validatedTemplateId, template };
  }

  async validateDeleteTemplateRequest(templateId: string, teamId: number): Promise<{ templateId: number; template: any }> {
    const { validatedTemplateId } = await this.validateTemplateId(templateId);
    const template = await this.templateRepository.findById(validatedTemplateId, teamId);
    if (!template) {
      throwError('Template not found', HttpStatus.NOT_FOUND, 'templateNotFound');
    }
    return { templateId: validatedTemplateId, template };
  }

  async validateDuplicateTemplateRequest(templateId: string, teamId: number): Promise<{ templateId: number; template: any }> {
    const { validatedTemplateId } = await this.validateTemplateId(templateId);
    const template = await this.templateRepository.findById(validatedTemplateId, teamId);
    if (!template) {
      throwError('Template not found', HttpStatus.NOT_FOUND, 'templateNotFound');
    }
    return { templateId: validatedTemplateId, template };
  }

  async validateRenderTemplateRequest(
    templateId: string,
    teamId: number,
    data: RenderTemplateDto,
  ): Promise<{ validatedData: RenderTemplateDto; template: any }> {
    const { validatedData } = await this.validateRenderTemplate(data);
    const { validatedTemplateId } = await this.validateTemplateId(templateId);
    const template = await this.templateRepository.findById(validatedTemplateId, teamId);
    if (!template) {
      throwError('Template not found', HttpStatus.NOT_FOUND, 'templateNotFound');
    }
    return { validatedData, template };
  }
}
