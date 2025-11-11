export enum TransactionStatus {
  pending = 'pending',
  complete = 'complete',
  failed = 'failed',
  cancelled = 'cancelled',
}

export enum UserType {
  customer = 'customer',
  merchant = 'merchant',
  admin = 'admin',
}

export enum TransactionType {
  cashIn = 'cash_in',
  cashOut = 'cash_out',
  transfer = 'transfer',
  payment = 'payment',
}

export enum UserStatus {
  active = 'ACTIVE',
  inactive = 'INACTIVE',
  suspended = 'SUSPENDED',
  banned = 'BANNED',
}

export enum OAuthProvider {
  GOOGLE = 'GOOGLE',
  GITHUB = 'GITHUB',
}

export enum ApiKeyStatus {
  active = 'active',
  revoked = 'revoked',
}

export enum ApiKeyPermission {
  fullAccess = 'full_access',
  sendingAccess = 'sending_access',
  readOnly = 'read_only',
}

export enum TeamInvitationStatus {
  pending = 'pending',
  accepted = 'accepted',
  expired = 'expired',
  cancelled = 'cancelled',
}

export enum DomainStatus {
  pending = 'pending',
  verified = 'verified',
  failed = 'failed',
}

export enum TemplateStatus {
  active = 'active',
  archived = 'archived',
}

export enum EmailStatus {
  queued = 'queued',
  sent = 'sent',
  delivered = 'delivered',
  opened = 'opened',
  clicked = 'clicked',
  bounced = 'bounced',
  failed = 'failed',
}

export enum WebhookStatus {
  enabled = 'enabled',
  disabled = 'disabled',
}

export enum WebhookDeliveryStatus {
  attempting = 'attempting',
  success = 'success',
  fail = 'fail',
}

export enum WebhookEventType {
  emailSent = 'email.sent',
  emailDelivered = 'email.delivered',
  emailDeliveryDelayed = 'email.delivery_delayed',
  emailComplained = 'email.complained',
  emailBounced = 'email.bounced',
  emailOpened = 'email.opened',
  emailClicked = 'email.clicked',
  emailReceived = 'email.received',
  emailFailed = 'email.failed',
  contactCreated = 'contact.created',
  contactUpdated = 'contact.updated',
  contactDeleted = 'contact.deleted',
  domainCreated = 'domain.created',
  domainUpdated = 'domain.updated',
  domainDeleted = 'domain.deleted',
}

export enum ContactStatus {
  subscribed = 'subscribed',
  unsubscribed = 'unsubscribed',
  bounced = 'bounced',
}

export enum BroadcastStatus {
  draft = 'draft',
  scheduled = 'scheduled',
  sending = 'sending',
  sent = 'sent',
  cancelled = 'cancelled',
}

export enum BroadcastRecipientStatus {
  pending = 'pending',
  sent = 'sent',
  failed = 'failed',
  opened = 'opened',
  clicked = 'clicked',
}

export enum MfaVerificationSessionStatus {
  pending = 'pending',
  verified = 'verified',
  expired = 'expired',
  failed = 'failed',
}

export enum TeamMemberRole {
  owner = 'owner',
  admin = 'admin',
  member = 'member',
  viewer = 'viewer',
}

export enum AwsSesRegion {
  us_east_1 = 'us-east-1', // N. Virginia
  eu_west_1 = 'eu-west-1', // Ireland
  sa_east_1 = 'sa-east-1', // São Paulo
  ap_northeast_1 = 'ap-northeast-1', // Tokyo
}

export enum AwsSesVerificationStatus {
  pending = 'PENDING',
  success = 'SUCCESS',
  failed = 'FAILED',
  temporary_failure = 'TEMPORARY_FAILURE',
  not_started = 'NOT_STARTED',
}

export const Constants = {
  successMessage: 'Success',
  errorMessage: 'An error occurred',
  unauthorizedMessage: 'Unauthorized access',
  notFoundMessage: 'Resource not found',
  validationErrorMessage: 'Validation failed',
  internalServerErrorMessage: 'Internal server error',
  serverError: 'Internal server error',
  passwordResetMessage: 'Password reset link requested successfully',
  passwordResetSuccessMessage: 'Password reset successfully. Please log in with your new password.',
  requiresTwoFactor: 'Two-factor authentication required',
  
  // Operation messages
  createdSuccessfully: 'Created successfully',
  updatedSuccessfully: 'Updated successfully',
  deletedSuccessfully: 'Deleted successfully',
  retrievedSuccessfully: 'Retrieved successfully',

  // Cron messages
  successCronMessage: 'Cron job executed successfully',
};
