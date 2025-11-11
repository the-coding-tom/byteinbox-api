import { TemplateStatus } from '@prisma/client';

export class CreateTemplateData {
  createdBy: number;
  teamId: number;
  name: string;
  html: string;
  versionNumber: number;
  alias?: string;
  description?: string;
  subject?: string;
  category?: string;
  from?: string;
  replyTo?: string[];
  text?: string;
  variables?: any;
}

export class FindTemplatesWithFilterData {
  teamId: number;
  keyword?: string;
  category?: string;
  status?: string;
  offset: number;
  limit: number;
}

export class UpdateTemplateData {
  name: string;
  description?: string;
  alias?: string;
  from?: string;
  subject?: string;
  replyTo?: string[];
  html: string;
  text?: string;
  variables?: any;
  createdBy?: number;
}

export class DuplicateTemplateData {
  alias?: string;
  name: string;
  description?: string;
  html: string;
  text?: string;
  subject?: string;
  category?: string;
  from?: string;
  replyTo?: string[] | null;
  variables: any[];
}

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

export class LatestTemplateVersionData {
  template_id: number;
  version_id: number;
  status: string;
}
