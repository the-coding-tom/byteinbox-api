export class CreateBroadcastData {
  teamId: number;
  createdBy?: number;
  audienceId: number;
  from: string;
  subject: string;
  replyTo?: string[];
  html?: string;
  text?: string;
  name?: string;
  scheduledAt?: Date;
  status?: string;
  sentAt?: Date;
}

export class UpdateBroadcastData {
  audienceId?: number;
  from?: string;
  subject?: string;
  replyTo?: string[];
  html?: string;
  text?: string;
  name?: string;
  scheduledAt?: Date;
  status?: string;
  sentAt?: Date;
}
