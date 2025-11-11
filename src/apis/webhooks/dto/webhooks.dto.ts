export class WebhookFilterDto {
  page?: number;
  limit?: number;
  status?: string;
  eventType?: string;
}

export class CreateWebhookDto {
  endpoint: string;
  events: string[];
}

export class CreateWebhookResponseDto {
  id: string;
  signing_secret: string;
}

export class WebhookListItem {
  id: string;
  createdAt: string;
  status: string;
  endpoint: string;
  events: string[];
}

export type GetWebhooksResponseDto = WebhookListItem[];

export class GetWebhookDetailsResponseDto {
  id: string;
  createdAt: string;
  status: string;
  endpoint: string;
  events: string[];
  signingSecret: string;
}

export class UpdateWebhookDto {
  endpoint?: string;
  events?: string[];
  status?: string;
}

export class UpdateWebhookResponseDto {
  id: string;
}

export class DeleteWebhookResponseDto {
  id: string;
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
  meta: {
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
