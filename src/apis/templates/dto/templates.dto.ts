export class TemplateFilterDto {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  search?: string;
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
    id: string;
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
    id: string;
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
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class GetTemplateDetailsResponseDto {
  template: {
    id: string;
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
    id: string;
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
    id: string;
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
