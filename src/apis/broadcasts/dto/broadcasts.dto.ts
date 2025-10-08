export class BroadcastFilterDto {
  page?: number;
  limit?: number;
  status?: string;
  audience?: string;
}

export class CreateBroadcastDto {
  name: string;
  subject: string;
  content?: string;
  templateId?: string;
  audienceId?: string;
  scheduledAt?: string;
}

export class CreateBroadcastResponseDto {
  broadcast: {
    id: string;
    name: string;
    subject: string;
    content?: string;
    templateId?: string;
    audienceId?: string;
    status: string;
    totalSent: number;
    opens: number;
    clicks: number;
    scheduledAt?: string;
    sentAt?: string;
    createdAt: string;
    updatedAt: string;
  };
}

export class GetBroadcastsResponseDto {
  broadcasts: Array<{
    id: string;
    name: string;
    subject: string;
    status: string;
    totalSent: number;
    opens: number;
    clicks: number;
    scheduledAt?: string;
    sentAt?: string;
    createdAt: string;
    updatedAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class GetBroadcastDetailsResponseDto {
  broadcast: {
    id: string;
    name: string;
    subject: string;
    content?: string;
    templateId?: string;
    audienceId?: string;
    status: string;
    totalSent: number;
    opens: number;
    clicks: number;
    scheduledAt?: string;
    sentAt?: string;
    createdAt: string;
    updatedAt: string;
    recipients: Array<{
      id: string;
      contactId: string;
      email: string;
      status: string;
      sentAt?: string;
      openedAt?: string;
      clickedAt?: string;
    }>;
  };
}

export class UpdateBroadcastDto {
  name?: string;
  subject?: string;
  content?: string;
  templateId?: string;
  audienceId?: string;
  scheduledAt?: string;
}

export class UpdateBroadcastResponseDto {
  broadcast: {
    id: string;
    name: string;
    subject: string;
    content?: string;
    templateId?: string;
    audienceId?: string;
    status: string;
    totalSent: number;
    opens: number;
    clicks: number;
    scheduledAt?: string;
    sentAt?: string;
    createdAt: string;
    updatedAt: string;
  };
}

export class DeleteBroadcastResponseDto {
  message: string;
}

export class AutoSaveBroadcastDto {
  subject?: string;
  content?: string;
  audienceId?: string;
  templateId?: string;
  scheduledAt?: string;
}

export class AutoSaveBroadcastResponseDto {
  broadcast: {
    id: string;
    name: string;
    subject: string;
    status: string;
    autoSavedAt: string;
  };
}

export class SendTestBroadcastDto {
  testEmails: string[];
}

export class SendTestBroadcastResponseDto {
  message: string;
  testResults: Array<{
    email: string;
    status: string;
    messageId?: string;
    error?: string;
  }>;
}

export class GetDraftBroadcastsResponseDto {
  broadcasts: Array<{
    id: string;
    name: string;
    subject: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class SendBroadcastResponseDto {
  message: string;
  broadcast: {
    id: string;
    status: string;
    totalSent: number;
    sentAt: string;
  };
}

export class GetBroadcastStatsResponseDto {
  stats: {
    total: number;
    sent: number;
    scheduled: number;
    draft: number;
    totalRecipients: number;
    totalOpens: number;
    totalClicks: number;
    averageOpenRate: number;
    averageClickRate: number;
  };
}
