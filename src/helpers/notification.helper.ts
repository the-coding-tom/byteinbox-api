import { NotificationType, NotificationSeverity } from '@prisma/client';
import prisma from '../common/prisma';

/**
 * Notification Helper
 * Creates notifications for users and teams
 */

interface CreateNotificationParams {
  userId?: number;
  teamId?: number;
  type: NotificationType;
  title: string;
  message: string;
  severity?: NotificationSeverity;
  metadata?: any;
}

/**
 * Create a notification for a user or team
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: params.userId,
        teamId: params.teamId,
        type: params.type,
        title: params.title,
        message: params.message,
        severity: params.severity || NotificationSeverity.info,
        metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : null,
      },
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
    // Don't throw - notifications are non-critical
  }
}

/**
 * Notify team about domain transfer
 */
export async function notifyDomainTransfer(
  teamId: number,
  domainName: string,
  transferredTo: boolean // true if transferred TO this team, false if transferred FROM
): Promise<void> {
  const title = transferredTo
    ? `Domain ${domainName} Added`
    : `Domain ${domainName} Transferred`;

  const message = transferredTo
    ? `The domain ${domainName} has been verified and added to your team. You can now use it to send emails.`
    : `The domain ${domainName} has been transferred to another team. This domain is no longer available for your team to use.`;

  const severity = transferredTo
    ? NotificationSeverity.success
    : NotificationSeverity.warning;

  await createNotification({
    teamId,
    type: NotificationType.domain_transfer,
    title,
    message,
    severity,
    metadata: { domainName, transferredTo },
  });
}

/**
 * Notify team about domain DNS verification success
 */
export async function notifyDomainDnsVerified(
  teamId: number,
  domainName: string,
  domainId: number
): Promise<void> {
  await createNotification({
    teamId,
    type: NotificationType.domain_dns_verified,
    title: `DNS Records Verified for ${domainName}`,
    message: `All DNS records for ${domainName} have been verified. The domain is now being registered with AWS SES.`,
    severity: NotificationSeverity.success,
    metadata: { domainName, domainId },
  });
}

/**
 * Notify team about domain AWS registration pending
 */
export async function notifyDomainAwsPending(
  teamId: number,
  domainName: string,
  domainId: number
): Promise<void> {
  await createNotification({
    teamId,
    type: NotificationType.domain_aws_pending,
    title: `${domainName} Registered with AWS`,
    message: `${domainName} has been registered with AWS SES and is awaiting final verification. This usually takes a few minutes.`,
    severity: NotificationSeverity.info,
    metadata: { domainName, domainId },
  });
}

/**
 * Notify team about domain full verification success
 */
export async function notifyDomainVerified(
  teamId: number,
  domainName: string,
  domainId: number
): Promise<void> {
  await createNotification({
    teamId,
    type: NotificationType.domain_verified,
    title: `${domainName} Fully Verified!`,
    message: `Congratulations! ${domainName} is now fully verified and ready to send emails. You can start using it immediately.`,
    severity: NotificationSeverity.success,
    metadata: { domainName, domainId },
  });
}

/**
 * Notify team about domain verification failure
 */
export async function notifyDomainFailed(
  teamId: number,
  domainName: string,
  domainId: number,
  reason?: string
): Promise<void> {
  await createNotification({
    teamId,
    type: NotificationType.domain_failed,
    title: `${domainName} Verification Failed`,
    message: `Domain verification for ${domainName} has failed. ${reason || 'Please check your DNS records and try again.'}`,
    severity: NotificationSeverity.error,
    metadata: { domainName, domainId, reason },
  });
}

/**
 * Notify team about domain deletion
 */
export async function notifyDomainDeleted(
  teamId: number,
  domainName: string
): Promise<void> {
  await createNotification({
    teamId,
    type: NotificationType.domain_deleted,
    title: `Domain ${domainName} Deleted`,
    message: `The domain ${domainName} has been removed from your team.`,
    severity: NotificationSeverity.info,
    metadata: { domainName },
  });
}
