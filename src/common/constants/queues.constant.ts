// Define all queue names here
export const PROCESS_NOTIFICATION_QUEUE = 'process-notification-queue';
export const VERIFY_DOMAIN_DNS_QUEUE = 'verify-domain-dns-queue';
export const VERIFY_DOMAIN_AWS_QUEUE = 'verify-domain-aws-queue';

// Email processing queues (for customer emails)
export const EMAIL_ROUTER_QUEUE = 'email-router-queue';
export const EMAIL_TEMPLATE_QUEUE = 'email-template-queue';
export const EMAIL_ATTACHMENT_QUEUE = 'email-attachment-queue';
export const SEND_EMAIL_QUEUE = 'send-email-queue';

// Internal notification queue (for system emails like verification, password reset, etc.)
export const INTERNAL_NOTIFICATION_QUEUE = 'internal-notification-queue';

// Broadcast processing queue
export const BROADCAST_PROCESSING_QUEUE = 'broadcast-processing-queue';

export const PROCESS_EMAIL_EVENT_QUEUE = 'process-email-event-queue';
export const GENERATE_TEMPLATE_PREVIEW_QUEUE = 'generate-template-preview-queue';
export const DELIVER_WEBHOOK_QUEUE = 'deliver-webhook-queue';
