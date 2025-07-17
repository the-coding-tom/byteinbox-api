import { Injectable } from '@nestjs/common';

import prisma from '../common/prisma';

import {
  EmailTemplateEntity,
  createEmailTemplate,
  updateEmailTemplate,
} from './entities/email-template.entity';

@Injectable()
export class EmailTemplateRepository {
  /**
   * Convert database result to entity, handling null values
   */
  private convertToEntity(template: any): EmailTemplateEntity {
    return createEmailTemplate({
      ...template,
      description: template.description || undefined,
      createdBy: template.createdBy || undefined,
      updatedBy: template.updatedBy || undefined,
    });
  }

  async createEmailTemplate(data: Partial<EmailTemplateEntity>): Promise<EmailTemplateEntity> {
    const template = await prisma.emailTemplate.create({
      data: {
        name: data.name!,
        subject: data.subject!,
        htmlContent: data.htmlContent!,
        description: data.description,
        isActive: data.isActive ?? true,
        isDefault: data.isDefault ?? false,
        version: data.version || 1,
        createdBy: data.createdBy,
        updatedBy: data.updatedBy,
      },
    });

    return createEmailTemplate({
      ...template,
      description: template.description || undefined,
      createdBy: template.createdBy || undefined,
      updatedBy: template.updatedBy || undefined,
    });
  }

  async findEmailTemplateById(id: number): Promise<EmailTemplateEntity | null> {
    const template = await prisma.emailTemplate.findUnique({
      where: { id },
    });

    return template
      ? createEmailTemplate({
        ...template,
        description: template.description || undefined,
        createdBy: template.createdBy || undefined,
        updatedBy: template.updatedBy || undefined,
      })
      : null;
  }

  async findEmailTemplateByName(name: string): Promise<EmailTemplateEntity | null> {
    const template = await prisma.emailTemplate.findUnique({
      where: { name },
    });

    return template ? this.convertToEntity(template) : null;
  }

  async findActiveEmailTemplateByName(name: string): Promise<EmailTemplateEntity | null> {
    const template = await prisma.emailTemplate.findFirst({
      where: {
        name,
        isActive: true,
      },
    });

    return template ? this.convertToEntity(template) : null;
  }

  async findAllEmailTemplates(): Promise<EmailTemplateEntity[]> {
    const templates = await prisma.emailTemplate.findMany({
      orderBy: { name: 'asc' },
    });

    return templates.map(template => this.convertToEntity(template));
  }

  async findActiveEmailTemplates(): Promise<EmailTemplateEntity[]> {
    const templates = await prisma.emailTemplate.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return templates.map(template => this.convertToEntity(template));
  }

  async findDefaultEmailTemplates(): Promise<EmailTemplateEntity[]> {
    const templates = await prisma.emailTemplate.findMany({
      where: { isDefault: true },
      orderBy: { name: 'asc' },
    });

    return templates.map(template => this.convertToEntity(template));
  }

  async updateEmailTemplate(
    id: number,
    data: Partial<EmailTemplateEntity>,
  ): Promise<EmailTemplateEntity> {
    const template = await prisma.emailTemplate.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
        updatedBy: data.updatedBy,
      },
    });

    return this.convertToEntity(template);
  }

  async deleteEmailTemplate(id: number): Promise<void> {
    await prisma.emailTemplate.delete({
      where: { id },
    });
  }

  async deactivateEmailTemplate(id: number, updatedBy?: number): Promise<EmailTemplateEntity> {
    return this.updateEmailTemplate(id, {
      isActive: false,
      updatedBy,
    });
  }

  async activateEmailTemplate(id: number, updatedBy?: number): Promise<EmailTemplateEntity> {
    return this.updateEmailTemplate(id, {
      isActive: true,
      updatedBy,
    });
  }

  async incrementVersion(id: number, updatedBy?: number): Promise<EmailTemplateEntity> {
    const template = await this.findEmailTemplateById(id);
    if (!template) {
      throw new Error(`Email template with id ${id} not found`);
    }

    return this.updateEmailTemplate(id, {
      version: template.version + 1,
      updatedBy,
    });
  }
}
