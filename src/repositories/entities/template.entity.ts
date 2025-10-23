import { TemplateStatus } from '@prisma/client';

export class TemplateEntity {
  id: number;
  createdBy?: number;
  teamId: number;
  name: string;
  description?: string;
  html: string;
  subject?: string;
  category?: string;
  variables: string[];
  status: TemplateStatus;
  opens: number;
  clicks: number;
  createdAt: Date;
  lastModified: Date;
}
