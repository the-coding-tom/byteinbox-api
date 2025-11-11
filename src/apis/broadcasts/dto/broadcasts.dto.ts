export class BroadcastFilterDto {
  page?: number;
  limit?: number;
  status?: string;
  audience?: string;
}

export class CreateBroadcastDto {
  audienceId: string; // Required: Audience ID
  from: string; // Required: Sender with friendly name (e.g., "Thomas <thomas@esoko.com>")
  subject: string; // Required: Subject line
  replyTo?: string[]; // Optional: Multiple reply-to addresses
  html?: string; // Optional: HTML content with contact properties (e.g., {{contact.first_name}})
  text?: string; // Optional: Plain text version
  name?: string; // Optional: Internal campaign name
  scheduledAt?: string; // Optional: Schedule for later
}

export class CreateBroadcastResponseDto {
  id: string; // Broadcast reference UUID
}

export class GetBroadcastsResponseDto {
  broadcasts: Array<{
    id: string;
    name: string;
    subject: string;
    status: string;
    scheduledAt?: string;
    sentAt?: string;
    createdAt: string;
    updatedAt: string;
  }>;
  meta: {
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
    from: string;
    replyTo?: string[];
    html?: string;
    text?: string;
    audienceId?: string;
    status: string;
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
  audienceId?: string;
  from?: string;
  subject?: string;
  replyTo?: string[];
  html?: string;
  text?: string;
  name?: string;
  scheduledAt?: string;
}

export class UpdateBroadcastResponseDto {
  broadcast: {
    id: string;
    name: string;
    subject: string;
    from: string;
    replyTo?: string[];
    html?: string;
    text?: string;
    audienceId?: string;
    status: string;
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
  html?: string;
  text?: string;
  audienceId?: string;
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
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class SendBroadcastDto {
  scheduledAt?: string; // Optional: "in 1 min", ISO date, or omit for immediate send
}

export class SendBroadcastResponseDto {
  id: string;
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
