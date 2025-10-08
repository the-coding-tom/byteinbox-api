import { Injectable } from '@nestjs/common';
import prisma from '../common/prisma';

@Injectable()
export class EmailTemplateRepository {
  async findActiveEmailTemplateByName(name: string): Promise<any | null> {
    return prisma.template.findFirst({
      where: {
        name,
        status: 'active',
      },
    });
  }
}
