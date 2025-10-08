export class WebhookFilterDto {
  page?: number;
  limit?: number;
  status?: string;
  eventType?: string;
}

export class CreateWebhookDto {
  url: string;
  events: string[];
  status?: string;
}

export class CreateWebhookResponseDto {
  webhook: {
    id: string;
    url: string;
    events: string[];
    status: string;
    secret: string;
    lastTriggered?: string;
    createdAt: string;
    updatedAt: string;
  };
}

export class GetWebhooksResponseDto {
  webhooks: Array<{
    id: string;
    url: string;
    events: string[];
    status: string;
    lastTriggered?: string;
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

export class GetWebhookDetailsResponseDto {
  webhook: {
    id: string;
    url: string;
    events: string[];
    status: string;
    secret: string;
    lastTriggered?: string;
    createdAt: string;
    updatedAt: string;
    deliveries: Array<{
      id: string;
      eventType: string;
      messageId?: string;
      status: string;
      attempts: number;
      createdAt: string;
      completedAt?: string;
    }>;
  };
}

export class UpdateWebhookDto {
  url?: string;
  events?: string[];
  status?: string;
}

export class UpdateWebhookResponseDto {
  webhook: {
    id: string;
    url: string;
    events: string[];
    status: string;
    secret: string;
    lastTriggered?: string;
    createdAt: string;
    updatedAt: string;
  };
}

export class DeleteWebhookResponseDto {
  message: string;
}

export class TestWebhookResponseDto {
  message: string;
  delivery: {
    id: string;
    status: string;
    response?: any;
    createdAt: string;
  };
}

export class GetWebhookDeliveriesResponseDto {
  deliveries: Array<{
    id: string;
    eventType: string;
    messageId?: string;
    status: string;
    attempts: number;
    createdAt: string;
    completedAt?: string;
    request: any;
    response?: any;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ToggleWebhookStatusDto {
  status: string;
}

export class ToggleWebhookStatusResponseDto {
  webhook: {
    id: string;
    url: string;
    status: string;
    updatedAt: string;
  };
}

export class GetWebhookEventsResponseDto {
  events: Array<{
    value: string;
    label: string;
    description: string;
    enabled: boolean;
  }>;
}
