export interface EmailTemplateEntity {
  id: number;
  name: string;
  subject: string;
  htmlContent: string;
  description?: string;
  isActive: boolean;
  isDefault: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: number;
  updatedBy?: number;
}

export function createEmailTemplate(data: Partial<EmailTemplateEntity>): EmailTemplateEntity {
  return {
    id: data.id || 0,
    name: data.name || '',
    subject: data.subject || '',
    htmlContent: data.htmlContent || '',
    description: data.description,
    isActive: data.isActive ?? true,
    isDefault: data.isDefault ?? false,
    version: data.version || 1,
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date(),
    createdBy: data.createdBy,
    updatedBy: data.updatedBy,
  };
}

export function updateEmailTemplate(
  template: EmailTemplateEntity,
  updates: Partial<EmailTemplateEntity>,
): EmailTemplateEntity {
  return {
    ...template,
    ...updates,
    updatedAt: new Date(),
  };
}
