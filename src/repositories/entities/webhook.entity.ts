export class CreateWebhookData {
  url: string;
  events: string[];
  teamId: number;
  createdBy?: number;
}

export class WebhookData {
  id: string;
  signingSecret: string;
}

export class WebhookDetailsData {
  id: string;
  createdAt: string;
  status: string;
  endpoint: string;
  events: string[];
  signingSecret: string;
}

export class WebhookListData {
  id: string;
  createdAt: string;
  status: string;
  endpoint: string;
  events: string[];
}

export class UpdateWebhookData {
  url?: string;
  events?: string[];
  status?: string;
}
