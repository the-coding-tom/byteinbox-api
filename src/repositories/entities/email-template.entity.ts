export class EmailTemplateEntity {
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
