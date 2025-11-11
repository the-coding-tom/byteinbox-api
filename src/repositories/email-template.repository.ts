import { Injectable } from '@nestjs/common';
import { TemplateStatus } from '@prisma/client';
import prisma from '../common/prisma';

@Injectable()
export class EmailTemplateRepository {
  async findActiveEmailTemplateByName(alias: string): Promise<any | null> {
    return prisma.template.findFirst({
      where: {
        alias,
        status: TemplateStatus.active,
      },
    });
  }
}
