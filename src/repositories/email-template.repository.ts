import { Injectable } from '@nestjs/common';
import prisma from '../common/prisma';

@Injectable()
export class EmailTemplateRepository {
  async createEmailTemplate(data: { name: string; subject: string; htmlContent: string; isActive?: boolean; isDefault?: boolean; createdBy?: number; updatedBy?: number }): Promise<any> {
    return prisma.emailTemplate.create({
      data: {
        name: data.name,
        subject: data.subject,
        htmlContent: data.htmlContent,
        isActive: data.isActive ?? true,
        isDefault: data.isDefault ?? false,
        createdBy: data.createdBy,
        updatedBy: data.updatedBy,
      },
    });
  }

  async findEmailTemplateById(id: number): Promise<any | null> {
    return prisma.emailTemplate.findUnique({
      where: { id },
    });
  }

  async findEmailTemplateByName(name: string): Promise<any | null> {
    return prisma.emailTemplate.findUnique({
      where: { name },
    });
  }

  async findActiveEmailTemplateByName(name: string): Promise<any | null> {
    return prisma.emailTemplate.findFirst({
      where: {
        name,
        isActive: true,
      },
    });
  }

  async findAllEmailTemplates(): Promise<any[]> {
    return prisma.emailTemplate.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findActiveEmailTemplates(): Promise<any[]> {
    return prisma.emailTemplate.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findDefaultEmailTemplates(): Promise<any[]> {
    return prisma.emailTemplate.findMany({
      where: { isDefault: true },
      orderBy: { name: 'asc' },
    });
  }

  async updateEmailTemplate(id: number, data: any): Promise<any> {
    return prisma.emailTemplate.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
        updatedBy: data.updatedBy,
      },
    });
  }

  async deleteEmailTemplate(id: number): Promise<void> {
    await prisma.emailTemplate.delete({
      where: { id },
    });
  }

  async deactivateEmailTemplate(id: number, updatedBy?: number): Promise<any> {
    return prisma.emailTemplate.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
        updatedBy,
      },
    });
  }

  async activateEmailTemplate(id: number, updatedBy?: number): Promise<any> {
    return prisma.emailTemplate.update({
      where: { id },
      data: {
        isActive: true,
        updatedAt: new Date(),
        updatedBy,
      },
    });
  }
}
