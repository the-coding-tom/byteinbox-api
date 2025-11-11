import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { TemplatesValidator } from './templates.validator';
import { TemplateRepository } from '../../repositories/template.repository';
import { TemplateVersionRepository } from '../../repositories/template-version.repository';
import { generateSuccessResponse } from '../../utils/util';
import { handleServiceError } from '../../utils/error.util';
import { Constants } from '../../common/enums/generic.enum';
import { GENERATE_TEMPLATE_PREVIEW_QUEUE } from '../../common/constants/queues.constant';
import {
  CreateTemplateDto,
  TemplateFilterDto,
  UpdateTemplateDto
} from './dto/templates.dto';

@Injectable()
export class TemplatesService {
  constructor(
    private readonly templatesValidator: TemplatesValidator,
    private readonly templateRepository: TemplateRepository,
    private readonly templateVersionRepository: TemplateVersionRepository,
    @InjectQueue(GENERATE_TEMPLATE_PREVIEW_QUEUE) private readonly previewQueue: Queue,
  ) {}

  async createTemplate(userId: number, teamId: number, createTemplateDto: CreateTemplateDto): Promise<any> {
    try {
      const { validatedData } = await this.templatesValidator.validateCreateTemplate(teamId, createTemplateDto);

      const template = await this.templateRepository.create({
        createdBy: userId,
        teamId,
        versionNumber: 1,
        name: validatedData.name,
        html: validatedData.html,
        alias: validatedData.alias,
        description: validatedData.description,
        subject: validatedData.subject,
        category: validatedData.category,
        from: validatedData.from,
        replyTo: validatedData.replyTo,
        text: validatedData.text,
        variables: validatedData.variables,
      });

      await this.previewQueue.add('generate-preview', {
        templateVersionId: template.versionId,
        html: template.html,
      });

      return generateSuccessResponse({
        statusCode: HttpStatus.CREATED,
        message: Constants.createdSuccessfully,
        data: {
          id: template.reference,
        },
      });
    } catch (error) {
      return handleServiceError('Error creating template', error);
    }
  }

  async getTemplates(userId: number, teamId: number, filter: TemplateFilterDto): Promise<any> {
    try {
      const { validatedData } = await this.templatesValidator.validateGetTemplates(teamId, filter);

      const { data } = await this.templateRepository.findWithFilter({
        teamId: validatedData.teamId,
        keyword: validatedData.filter.keyword,
        category: validatedData.filter.category,
        status: validatedData.filter.status,
        offset: validatedData.filter.offset,
        limit: validatedData.filter.limit,
      });

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.retrievedSuccessfully,
        data,
      });
    } catch (error) {
      return handleServiceError('Error retrieving templates', error);
    }
  }

  async getTemplateDetails(templateId: string, userId: number, teamId: number): Promise<any> {
    try {
      const { template } = await this.templatesValidator.validateGetTemplateDetails(templateId, teamId);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.retrievedSuccessfully,
        data: template,
      });
    } catch (error) {
      return handleServiceError('Error retrieving template details', error);
    }
  }

  async updateTemplate(templateId: string, userId: number, teamId: number, updateTemplateDto: UpdateTemplateDto): Promise<any> {
    try {
      const { validatedData } = await this.templatesValidator.validateUpdateTemplateRequest(
        templateId,
        teamId,
        updateTemplateDto,
      );

      const newVersion = await this.templateRepository.update(validatedData.template.id, {
        name: validatedData.name!,
        description: validatedData.description,
        alias: validatedData.alias,
        from: validatedData.from,
        subject: validatedData.subject,
        replyTo: validatedData.replyTo,
        html: validatedData.html!,
        text: validatedData.text,
        variables: validatedData.variables,
        createdBy: userId,
      });

      await this.previewQueue.add('generate-preview', {
        templateVersionId: newVersion.id,
        html: newVersion.html,
      });

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.updatedSuccessfully,
        data: {
          id: validatedData.template.reference,
        },
      });
    } catch (error) {
      return handleServiceError('Error updating template', error);
    }
  }

  async deleteTemplate(templateId: string, userId: number, teamId: number): Promise<any> {
    try {
      // Validate template
      const { template } = await this.templatesValidator.validateDeleteTemplate(templateId, teamId);

      await this.templateRepository.delete(template.reference, teamId);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.deletedSuccessfully,
        data: {
          id: templateId,
        },
      });
    } catch (error) {
      return handleServiceError('Error deleting template', error);
    }
  }

  async duplicateTemplate(templateId: string, userId: number, teamId: number): Promise<any> {
    try {
      const { template } = await this.templatesValidator.validateDuplicateTemplate(templateId, teamId);

      const duplicatedTemplate = await this.templateRepository.duplicate(
        {
          alias: template.alias,
          name: `${template.name} (Copy)`,
          description: template.description,
          html: template.html,
          text: template.text,
          subject: template.subject,
          category: template.category,
          from: template.from,
          replyTo: template.replyTo,
          variables: template.variables || [],
        },
        teamId,
        userId,
        1,
      );

      return generateSuccessResponse({
        statusCode: HttpStatus.CREATED,
        message: Constants.createdSuccessfully,
        data: {
          id: duplicatedTemplate.reference,
        },
      });
    } catch (error) {
      return handleServiceError('Error duplicating template', error);
    }
  }

  async publishTemplate(templateId: string, userId: number, teamId: number): Promise<any> {
    try {
      const { templateId: validatedTemplateId, versionId } = await this.templatesValidator.validatePublishTemplate(templateId, teamId);

      await this.templateVersionRepository.publishVersion(validatedTemplateId, versionId, userId);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.updatedSuccessfully,
        data: {
          id: templateId,
        },
      });
    } catch (error) {
      return handleServiceError('Error publishing template', error);
    }
  }
}
