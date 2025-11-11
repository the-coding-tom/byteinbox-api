export class TemplateFilterDto {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  search?: string;
  teamId?: number;
}

export class TemplateVariableDto {
  key: string;
  type: string;
  fallbackValue?: any;
}

export class CreateTemplateDto {
  name: string;
  html: string;
  alias?: string;
  description?: string;
  subject?: string;
  category?: string;
  from?: string;
  replyTo?: string[];
  text?: string;
  variables?: TemplateVariableDto[];
}

export class CreateTemplateResponseDto {
  id: string;
}

export class GetTemplatesResponseDto {
  templates: Array<{
    id: number;
    name: string;
    description?: string;
    subject?: string;
    category?: string;
    status: string;
    opens: number;
    clicks: number;
    createdAt: string;
    lastModified: string;
  }>;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class TemplateVariableResponseDto {
  id: string;
  key: string;
  type: string;
  fallbackValue?: any;
  createdAt: string;
  updatedAt: string;
}

export class GetTemplateDetailsResponseDto {
  object: string;
  id: string;
  currentVersionId: string;
  alias: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  publishedAt: string | null;
  from: string | null;
  subject: string | null;
  replyTo: string[] | null;
  html: string;
  text: string | null;
  description?: string | null;
  category?: string | null;
  previewUrl?: string | null;
  variables: TemplateVariableResponseDto[];
  hasUnpublishedVersions: boolean;
}

export class UpdateTemplateDto {
  name?: string;
  description?: string;
  alias?: string;
  from?: string;
  subject?: string;
  replyTo?: string[];
  html?: string;
  text?: string;
  variables?: TemplateVariableDto[];
}

export class UpdateTemplateResponseDto {
  id: string;
}

export class DeleteTemplateResponseDto {
  message: string;
}

export class DuplicateTemplateResponseDto {
  template: {
    id: number;
    name: string;
    description?: string;
    html: string;
    subject?: string;
    category?: string;
    variables: string[];
    status: string;
    opens: number;
    clicks: number;
    createdAt: string;
    lastModified: string;
  };
}

export class RenderTemplateDto {
  templateId: number;
  data: any;
}

export class RenderTemplateResponseDto {
  html: string;
  text: string;
  subject?: string;
}
