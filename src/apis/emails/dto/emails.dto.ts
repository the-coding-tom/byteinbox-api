export class EmailFilterDto {
  page?: number;
  limit?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}

export class SendEmailDto {
  to: string[];
  cc?: string[];
  bcc?: string[];
  replyTo?: string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  domainId?: string;
  templateId?: string;
  variables?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: string; // Base64 encoded
    type?: string;
  }>;
}

export class SendEmailResponseDto {
  email: {
    id: string;
    status: string;
    sentAt: string;
    messageId: string;
  };
}

export class GetEmailsResponseDto {
  emails: Array<{
    id: string;
    from: string;
    to: string;
    subject: string;
    status: string;
    sentAt: string;
    opens: number;
    clicks: number;
  }>;
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

export class GetEmailDetailsResponseDto {
  email: {
    id: string;
    from: string;
    to: string[];
    cc: string[];
    bcc: string[];
    replyTo: string[];
    subject: string;
    text?: string;
    html?: string;
    status: string;
    opens: number;
    clicks: number;
    lastOpened?: string;
    lastClicked?: string;
    sentAt?: string;
    deliveredAt?: string;
    createdAt: string;
    events: Array<{
      type: string;
      timestamp: string;
      userAgent?: string;
      ipAddress?: string;
      location?: string;
    }>;
    attachments: Array<{
      id: string;
      filename: string;
      type?: string;
      size?: number;
    }>;
  };
}

export class GetEmailStatsResponseDto {
  stats: {
    total: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    failed: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
  };
  period: {
    start: string;
    end: string;
  };
}

export class GetEmailStatusesResponseDto {
  statuses: Array<{
    value: string;
    label: string;
    count: number;
  }>;
}
