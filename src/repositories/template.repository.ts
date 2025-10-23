import { Injectable } from '@nestjs/common';
import { TemplateStatus } from '@prisma/client';
import prisma from '../common/prisma';
import { TemplateEntity } from './entities/template.entity';

@Injectable()
export class TemplateRepository {
  async create(data: {
    createdBy: number;
    teamId: number;
    name: string;
    description?: string;
    html: string;
    subject?: string;
    category?: string;
    variables?: string[];
  }): Promise<TemplateEntity> {
    const template = await prisma.template.create({
      data: {
        createdBy: data.createdBy,
        teamId: data.teamId,
        name: data.name,
        description: data.description,
        html: data.html,
        subject: data.subject,
        category: data.category,
        variables: data.variables || [],
        status: TemplateStatus.active,
      },
    });

    return this.mapToEntity(template);
  }

  async findById(id: number, teamId: number): Promise<TemplateEntity | null> {
    const template = await prisma.template.findFirst({
      where: {
        id,
        teamId,
      },
    });

    return template ? this.mapToEntity(template) : null;
  }

  async findByTeamId(teamId: number, options: {
    page?: number;
    limit?: number;
    category?: string;
    status?: TemplateStatus;
    search?: string;
  } = {}): Promise<{ templates: TemplateEntity[]; total: number }> {
    const { page = 1, limit = 10, category, status, search } = options;
    const skip = (page - 1) * limit;

    const where: any = {
      teamId,
    };

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.template.count({ where }),
    ]);

    return {
      templates: templates.map(template => this.mapToEntity(template)),
      total,
    };
  }

  async update(id: number, teamId: number, data: {
    name?: string;
    description?: string;
    html?: string;
    subject?: string;
    category?: string;
    variables?: string[];
    status?: TemplateStatus;
  }): Promise<TemplateEntity | null> {
    const template = await prisma.template.updateMany({
      where: {
        id,
        teamId,
      },
      data: {
        ...data,
        lastModified: new Date(),
      },
    });

    if (template.count === 0) {
      return null;
    }

    const updatedTemplate = await prisma.template.findUnique({
      where: { id },
    });

    return updatedTemplate ? this.mapToEntity(updatedTemplate) : null;
  }

  async delete(id: number, teamId: number): Promise<boolean> {
    const result = await prisma.template.deleteMany({
      where: {
        id,
        teamId,
      },
    });

    return result.count > 0;
  }

  async duplicate(id: number, teamId: number, createdBy: number): Promise<TemplateEntity | null> {
    const originalTemplate = await this.findById(id, teamId);
    if (!originalTemplate) {
      return null;
    }

    const duplicatedTemplate = await prisma.template.create({
      data: {
        createdBy,
        teamId,
        name: `${originalTemplate.name} (Copy)`,
        description: originalTemplate.description,
        html: originalTemplate.html,
        subject: originalTemplate.subject,
        category: originalTemplate.category,
        variables: originalTemplate.variables,
        status: TemplateStatus.active,
      },
    });

    return this.mapToEntity(duplicatedTemplate);
  }

  async findActiveByName(name: string, teamId: number): Promise<TemplateEntity | null> {
    const template = await prisma.template.findFirst({
      where: {
        name,
        teamId,
        status: TemplateStatus.active,
      },
    });

    return template ? this.mapToEntity(template) : null;
  }

  async incrementOpens(id: number): Promise<void> {
    await prisma.template.update({
      where: { id },
      data: {
        opens: {
          increment: 1,
        },
      },
    });
  }

  async incrementClicks(id: number): Promise<void> {
    await prisma.template.update({
      where: { id },
      data: {
        clicks: {
          increment: 1,
        },
      },
    });
  }

  private mapToEntity(template: any): TemplateEntity {
    return {
      id: template.id,
      createdBy: template.createdBy,
      teamId: template.teamId,
      name: template.name,
      description: template.description,
      html: template.html,
      subject: template.subject,
      category: template.category,
      variables: template.variables,
      status: template.status,
      opens: template.opens,
      clicks: template.clicks,
      createdAt: template.createdAt,
      lastModified: template.lastModified,
    };
  }
}
