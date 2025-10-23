export class EmailFilterDto {
  page?: number;
  limit?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}

export class SendEmailDto {
  // Required fields
  from: string; // Sender email address. Format: "Your Name <sender@domain.com>" or "sender@domain.com"
  to: string[]; // Recipient email address(es). Max 50.
  subject: string; // Email subject

  // Optional fields
  bcc?: string[]; // Bcc recipient email address(es)
  cc?: string[]; // Cc recipient email address(es)
  replyTo?: string[]; // Reply-to email address(es)
  html?: string; // The HTML version of the message
  text?: string; // The plain text version of the message
  scheduledAt?: string; // Schedule email to be sent later (natural language or ISO 8601)
  headers?: Record<string, string>; // Custom headers to add to the email
  attachments?: Array<{
    content?: Buffer | string; // Content of attached file, passed as buffer or Base64 string
    filename: string; // Name of attached file
    path?: string; // Path where the attachment file is hosted
    contentType?: string; // Content type for the attachment, if not set will be derived from the filename property
    contentId?: string; // Content ID for embedding images inline (e.g., <img src="cid:...">)
  }>;

  // ByteInbox-specific fields (internal, not in public API spec)
  templateId?: string; // Template ID for templated emails (future feature)
  variables?: Record<string, any>; // Template variables (future feature)
}

export class SendEmailResponseDto {
  id: string;
  status: string;
  sentAt: string;
  messageId: string;
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

// AWS SNS/SES Event DTOs (incoming webhook data)
export type SnsMessageType = 'SubscriptionConfirmation' | 'Notification' | 'UnsubscribeConfirmation';

export type SesEventType =
  | 'Bounce'
  | 'Complaint'
  | 'Delivery'
  | 'Send'
  | 'Reject'
  | 'Open'
  | 'Click'
  | 'Rendering Failure'
  | 'DeliveryDelay'
  | 'Subscription';

export type SesNotificationType = 'Bounce' | 'Complaint' | 'Delivery';

export interface SnsMessageDto {
  Type: SnsMessageType;
  MessageId: string;
  TopicArn: string;
  Message: string;
  Timestamp: string;
  SignatureVersion: string;
  Signature: string;
  SigningCertURL: string;
  UnsubscribeURL?: string;
  [key: string]: any;
}

export interface SnsSubscriptionConfirmationDto extends SnsMessageDto {
  Type: 'SubscriptionConfirmation';
  Token: string;
  SubscribeURL: string;
}

export interface SnsNotificationDto extends SnsMessageDto {
  Type: 'Notification';
  Subject?: string;
}

export interface SesMailObjectDto {
  timestamp: string;
  messageId: string;
  source: string;
  sourceArn: string;
  sourceIp: string;
  sendingAccountId: string;
  destination: string[];
  headersTruncated?: boolean;
  headers?: Array<{ name: string; value: string }>;
  commonHeaders?: {
    from?: string[];
    to?: string[];
    cc?: string[];
    bcc?: string[];
    subject?: string;
    messageId?: string;
    date?: string;
  };
  tags?: {
    [key: string]: string[];
  };
}

export interface SesBounceEventDto {
  eventType: 'Bounce';
  mail: SesMailObjectDto;
  bounce: {
    bounceType: 'Undetermined' | 'Permanent' | 'Transient';
    bounceSubType: string;
    bouncedRecipients: Array<{
      emailAddress: string;
      action?: string;
      status?: string;
      diagnosticCode?: string;
    }>;
    timestamp: string;
    feedbackId: string;
    remoteMtaIp?: string;
    reportingMTA?: string;
  };
}

export interface SesComplaintEventDto {
  eventType: 'Complaint';
  mail: SesMailObjectDto;
  complaint: {
    complainedRecipients: Array<{
      emailAddress: string;
    }>;
    timestamp: string;
    feedbackId: string;
    complaintSubType?: string | null;
    userAgent?: string;
    complaintFeedbackType?: string;
    arrivalDate?: string;
  };
}

export interface SesDeliveryEventDto {
  eventType: 'Delivery';
  mail: SesMailObjectDto;
  delivery: {
    timestamp: string;
    processingTimeMillis: number;
    recipients: string[];
    smtpResponse: string;
    reportingMTA: string;
    remoteMtaIp?: string;
  };
}

export interface SesSendEventDto {
  eventType: 'Send';
  mail: SesMailObjectDto;
  send: Record<string, never>;
}

export interface SesRejectEventDto {
  eventType: 'Reject';
  mail: SesMailObjectDto;
  reject: {
    reason: string;
  };
}

export interface SesOpenEventDto {
  eventType: 'Open';
  mail: SesMailObjectDto;
  open: {
    timestamp: string;
    userAgent: string;
    ipAddress: string;
  };
}

export interface SesClickEventDto {
  eventType: 'Click';
  mail: SesMailObjectDto;
  click: {
    timestamp: string;
    userAgent: string;
    ipAddress: string;
    link: string;
    linkTags?: {
      [key: string]: string[];
    };
  };
}

export interface SesRenderingFailureEventDto {
  eventType: 'Rendering Failure';
  mail: SesMailObjectDto;
  failure: {
    errorMessage: string;
    templateName: string;
  };
}

export interface SesDeliveryDelayEventDto {
  eventType: 'DeliveryDelay';
  mail: SesMailObjectDto;
  deliveryDelay: {
    timestamp: string;
    delayType: string;
    delayedRecipients: Array<{
      emailAddress: string;
      status?: string;
      diagnosticCode?: string;
    }>;
  };
}

export interface SesSubscriptionEventDto {
  eventType: 'Subscription';
  mail: SesMailObjectDto;
  subscription: {
    contactList: string;
    timestamp: string;
    source: string;
    newTopicPreferences?: {
      unsubscribeAll: boolean;
      topicSubscriptionStatus?: Array<{
        topicName: string;
        subscriptionStatus: string;
      }>;
    };
    oldTopicPreferences?: {
      unsubscribeAll: boolean;
      topicSubscriptionStatus?: Array<{
        topicName: string;
        subscriptionStatus: string;
      }>;
    };
  };
}

export type SesEventDto =
  | SesBounceEventDto
  | SesComplaintEventDto
  | SesDeliveryEventDto
  | SesSendEventDto
  | SesRejectEventDto
  | SesOpenEventDto
  | SesClickEventDto
  | SesRenderingFailureEventDto
  | SesDeliveryDelayEventDto
  | SesSubscriptionEventDto;

export interface SesNotificationBounceDto {
  notificationType: 'Bounce';
  mail: SesMailObjectDto;
  bounce: SesBounceEventDto['bounce'];
}

export interface SesNotificationComplaintDto {
  notificationType: 'Complaint';
  mail: SesMailObjectDto;
  complaint: SesComplaintEventDto['complaint'];
}

export interface SesNotificationDeliveryDto {
  notificationType: 'Delivery';
  mail: SesMailObjectDto;
  delivery: SesDeliveryEventDto['delivery'];
}

export type SesNotificationMessageDto =
  | SesNotificationBounceDto
  | SesNotificationComplaintDto
  | SesNotificationDeliveryDto;

export type SesCombinedMessageDto = SesEventDto | SesNotificationMessageDto;
