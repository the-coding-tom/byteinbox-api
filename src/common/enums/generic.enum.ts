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
  failed = 'failed',
  bounced = 'bounced',
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
