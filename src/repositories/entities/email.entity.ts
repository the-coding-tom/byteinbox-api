import { EmailStatus } from '@prisma/client';

export class CreateEmailData {
  createdBy: number;
  teamId: number;
  domainId: number;
  apiKeyId?: number;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  replyTo?: string[];
  subject: string;
  text?: string;
  html?: string;
  status: EmailStatus;
}

export class CreateAttachmentData {
  filename: string;
  content?: string;
  path?: string;
  contentType: string;
  contentId?: string;
}

export class CreateEmailEventData {
  emailId: number;
  eventType: string;
  bounceType?: string;
  bounceSubType?: string;
  complaintFeedbackType?: string;
  userAgent?: string;
  ipAddress?: string;
  location?: string;
  metadata?: any;
}

export class FindEmailsWithFilterData {
  teamId: number;
  keyword?: string;
  status?: string;
  domainId?: number;
  dateFrom?: Date;
  dateTo?: Date;
  offset?: number;
  limit?: number;
}

export class EmailWithRelationsData {
  id: number;
  createdBy: number;
  teamId: number;
  domainId: number;
  apiKeyId?: number;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  replyTo?: string[];
  subject: string;
  text?: string;
  html?: string;
  status: EmailStatus;
  messageId?: string;
  opens: number;
  clicks: number;
  lastOpened?: Date;
  lastClicked?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  domain?: any;
  attachments?: any[];
  events?: any[];
}
