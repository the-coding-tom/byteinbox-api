import { Injectable } from '@nestjs/common';
import prisma from '../common/prisma';

@Injectable()
export class EmailTemplateRepository {
  async createEmailTemplate(data: {
    name: string;
    subject?: string;
    html: string;
    description?: string;
    category?: string;
    variables?: string[];
    status?: string;
    createdBy?: number;
    teamId: number;
  }): Promise<any> {
    return prisma.template.create({
      data: {
        name: data.name,
        subject: data.subject,
        html: data.html,
        description: data.description,
        category: data.category,
        variables: data.variables || [],
        status: data.status || 'active',
        createdBy: data.createdBy,
        teamId: data.teamId,
      },
    });
  }

  async findEmailTemplateById(id: number): Promise<any | null> {
    return prisma.template.findUnique({
      where: { id },
      include: {
        creator: true,
        team: true,
      },
    });
  }

  async findEmailTemplateByName(name: string): Promise<any | null> {
    return prisma.template.findFirst({
      where: { name },
    });
  }

  async findActiveEmailTemplateByName(name: string): Promise<any | null> {
    return prisma.template.findFirst({
      where: {
        name,
        status: 'active',
      },
    });
  }

  async findAllEmailTemplates(): Promise<any[]> {
    return prisma.template.findMany({
      orderBy: { name: 'asc' },
      include: {
        creator: true,
        team: true,
      },
    });
  }

  async findActiveEmailTemplates(): Promise<any[]> {
    return prisma.template.findMany({
      where: { status: 'active' },
      orderBy: { name: 'asc' },
    });
  }

  async findDefaultEmailTemplates(): Promise<any[]> {
    return prisma.template.findMany({
      where: { category: 'default' },
      orderBy: { name: 'asc' },
    });
  }

  async updateEmailTemplate(id: number, data: any): Promise<any> {
    return prisma.template.update({
      where: { id },
      data: {
        ...data,
        lastModified: new Date(),
      },
    });
  }

  async deleteEmailTemplate(id: number): Promise<void> {
    await prisma.template.delete({
      where: { id },
    });
  }

  async deactivateEmailTemplate(id: number): Promise<any> {
    return prisma.template.update({
      where: { id },
      data: {
        status: 'archived',
        lastModified: new Date(),
      },
    });
  }

  async activateEmailTemplate(id: number): Promise<any> {
    return prisma.template.update({
      where: { id },
      data: {
        status: 'active',
        lastModified: new Date(),
      },
    });
  }
}
