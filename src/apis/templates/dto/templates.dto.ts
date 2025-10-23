export class TemplateFilterDto {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  search?: string;
  teamId?: number;
}

export class CreateTemplateDto {
  name: string;
  description?: string;
  html: string;
  subject?: string;
  category?: string;
  variables?: string[];
}

export class CreateTemplateResponseDto {
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

export class GetTemplateDetailsResponseDto {
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

export class UpdateTemplateDto {
  name?: string;
  description?: string;
  html?: string;
  subject?: string;
  category?: string;
  variables?: string[];
  status?: string;
}

export class UpdateTemplateResponseDto {
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
