import { Injectable } from '@nestjs/common';
import { TemplatesValidator } from './templates.validator';
import { TemplateRepository } from '../../repositories/template.repository';
import { TemplateUtil } from '../../utils/template.util';
import { generateSuccessResponse } from '../../utils/util';
import { handleServiceError } from '../../utils/error.util';
import { Constants } from '../../common/enums/generic.enum';
import { config } from '../../config/config';
import { TemplateStatus } from '@prisma/client';
import { 
  CreateTemplateDto, 
  TemplateFilterDto,
  CreateTemplateResponseDto, 
  GetTemplatesResponseDto, 
  GetTemplateDetailsResponseDto, 
  UpdateTemplateDto, 
  UpdateTemplateResponseDto, 
  DeleteTemplateResponseDto, 
  DuplicateTemplateResponseDto,
  RenderTemplateDto,
  RenderTemplateResponseDto
} from './dto/templates.dto';

@Injectable()
export class TemplatesService {
  constructor(
    private readonly templatesValidator: TemplatesValidator,
    private readonly templateRepository: TemplateRepository,
  ) {}

  async createTemplate(userId: number, teamId: number, createTemplateDto: CreateTemplateDto): Promise<any> {
    try {
      const { validatedData } = await this.templatesValidator.validateCreateTemplate(createTemplateDto);

      const template = await this.templateRepository.create({
        createdBy: userId,
        teamId,
        name: validatedData.name,
        description: validatedData.description,
        html: validatedData.html,
        subject: validatedData.subject,
        category: validatedData.category,
        variables: validatedData.variables,
      });

      const response: CreateTemplateResponseDto = {
        template: {
          id: template.id,
          name: template.name,
          description: template.description,
          html: template.html,
          subject: template.subject,
          category: template.category,
          variables: template.variables,
          status: template.status,
          opens: template.opens,
          clicks: template.clicks,
          createdAt: template.createdAt.toISOString(),
          lastModified: template.lastModified.toISOString(),
        },
      };

      return generateSuccessResponse({
        statusCode: 201,
        message: Constants.createdSuccessfully,
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'Error creating template');
    }
  }

  async getTemplates(userId: number, teamId: number, filter: TemplateFilterDto): Promise<any> {
    try {
      const page = filter.page || config.validation.pagination.defaultPage;
      const limit = Math.min(filter.limit || config.validation.pagination.defaultLimit, config.validation.pagination.maxLimit);
      
      const { templates, total } = await this.templateRepository.findByTeamId(
        teamId,
        {
          page,
          limit,
          category: filter.category,
          status: filter.status as TemplateStatus,
          search: filter.search,
        }
      );

      const response: GetTemplatesResponseDto = {
        templates: templates.map(template => ({
          id: template.id,
          name: template.name,
          description: template.description,
          subject: template.subject,
          category: template.category,
          status: template.status,
          opens: template.opens,
          clicks: template.clicks,
          createdAt: template.createdAt.toISOString(),
          lastModified: template.lastModified.toISOString(),
        })),
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };

      return generateSuccessResponse({
        statusCode: 200,
        message: Constants.retrievedSuccessfully,
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'Error retrieving templates');
    }
  }

  async getTemplateDetails(templateId: string, userId: number, teamId: number): Promise<any> {
    try {
      const { template } = await this.templatesValidator.validateGetTemplateDetails(templateId, teamId);

      const response: GetTemplateDetailsResponseDto = {
        template: {
          id: template.id,
          name: template.name,
          description: template.description,
          html: template.html,
          subject: template.subject,
          category: template.category,
          variables: template.variables,
          status: template.status,
          opens: template.opens,
          clicks: template.clicks,
          createdAt: template.createdAt.toISOString(),
          lastModified: template.lastModified.toISOString(),
        },
      };

      return generateSuccessResponse({
        statusCode: 200,
        message: Constants.retrievedSuccessfully,
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'Error retrieving template details');
    }
  }

  async updateTemplate(templateId: string, userId: number, teamId: number, updateTemplateDto: UpdateTemplateDto): Promise<any> {
    try {
      const { templateId: validatedTemplateId, validatedData } = await this.templatesValidator.validateUpdateTemplateRequest(
        templateId,
        teamId,
        updateTemplateDto,
      );

      const template = await this.templateRepository.update(validatedTemplateId, teamId, {
        name: validatedData.name,
        description: validatedData.description,
        html: validatedData.html,
        subject: validatedData.subject,
        category: validatedData.category,
        variables: validatedData.variables,
        status: validatedData.status as TemplateStatus,
      });

      const response: UpdateTemplateResponseDto = {
        template: {
          id: template!.id,
          name: template!.name,
          description: template!.description,
          html: template!.html,
          subject: template!.subject,
          category: template!.category,
          variables: template!.variables,
          status: template!.status,
          opens: template!.opens,
          clicks: template!.clicks,
          createdAt: template!.createdAt.toISOString(),
          lastModified: template!.lastModified.toISOString(),
        },
      };

      return generateSuccessResponse({
        statusCode: 200,
        message: Constants.updatedSuccessfully,
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'Error updating template');
    }
  }

  async deleteTemplate(templateId: string, userId: number, teamId: number): Promise<any> {
    try {
      const { templateId: validatedTemplateId } = await this.templatesValidator.validateDeleteTemplateRequest(templateId, teamId);

      await this.templateRepository.delete(validatedTemplateId, teamId);

      const response: DeleteTemplateResponseDto = {
        message: Constants.deletedSuccessfully,
      };

      return generateSuccessResponse({
        statusCode: 200,
        message: Constants.deletedSuccessfully,
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'Error deleting template');
    }
  }

  async duplicateTemplate(templateId: string, userId: number, teamId: number): Promise<any> {
    try {
      const { templateId: validatedTemplateId } = await this.templatesValidator.validateDuplicateTemplateRequest(templateId, teamId);

      const duplicatedTemplate = await this.templateRepository.duplicate(validatedTemplateId, teamId, userId);

      const response: DuplicateTemplateResponseDto = {
        template: {
          id: duplicatedTemplate!.id,
          name: duplicatedTemplate!.name,
          description: duplicatedTemplate!.description,
          html: duplicatedTemplate!.html,
          subject: duplicatedTemplate!.subject,
          category: duplicatedTemplate!.category,
          variables: duplicatedTemplate!.variables,
          status: duplicatedTemplate!.status,
          opens: duplicatedTemplate!.opens,
          clicks: duplicatedTemplate!.clicks,
          createdAt: duplicatedTemplate!.createdAt.toISOString(),
          lastModified: duplicatedTemplate!.lastModified.toISOString(),
        },
      };

      return generateSuccessResponse({
        statusCode: 201,
        message: Constants.createdSuccessfully,
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'Error duplicating template');
    }
  }

  async renderTemplate(templateId: string, teamId: number, renderTemplateDto: RenderTemplateDto): Promise<any> {
    try {
      const { template, validatedData } = await this.templatesValidator.validateRenderTemplateRequest(
        templateId,
        teamId,
        renderTemplateDto,
      );

      const { html, text, subject } = TemplateUtil.renderWithSubject(
        template.html,
        template.subject,
        validatedData.data
      );

      const response: RenderTemplateResponseDto = {
        html,
        text,
        subject,
      };

      return generateSuccessResponse({
        statusCode: 200,
        message: 'Template rendered successfully',
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'Error rendering template');
    }
  }
}
