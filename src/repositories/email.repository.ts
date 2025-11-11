import { Injectable } from '@nestjs/common';
import { EmailStatus, Prisma } from '@prisma/client';
import prisma from '../common/prisma';
import {
  CreateEmailData,
  CreateAttachmentData,
  FindEmailsWithFilterData,
} from './entities/email.entity';

@Injectable()
export class EmailRepository {
  /**
   * Create a new email with optional attachments and recipients (TO + CC) in a single atomic transaction
   */
  async createEmailWithAttachments(
    emailData: CreateEmailData,
    attachments: CreateAttachmentData[] = []
  ): Promise<any> {
    return prisma.email.create({
      data: {
        createdBy: emailData.createdBy,
        teamId: emailData.teamId,
        domainId: emailData.domainId,
        apiKeyId: emailData.apiKeyId,
        from: emailData.from,
        to: emailData.to,
        cc: emailData.cc,
        bcc: emailData.bcc,
        replyTo: emailData.replyTo,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
        templateId: emailData.templateId,
        templateData: emailData.templateData,
        attachments: attachments.length > 0 ? {
          createMany: {
            data: attachments,
          },
        } : undefined,
        recipients: {
          createMany: {
            data: [
              ...emailData.to.map(email => ({ recipient: email })),
              ...(emailData.cc || []).map(email => ({ recipient: email })),
              ...(emailData.bcc || []).map(email => ({ recipient: email })),
            ],
          },
        },
      },
      include: {
        attachments: true,
        recipients: true,
      },
    });
  }

  /**
   * Find email by ID with all relations
   */
  async findById(id: number): Promise<any | null> {
    return prisma.email.findUnique({
      where: { id },
      include: {
        Domain: {
          select: {
            id: true,
            name: true,
            region: true,
            dkimSelector: true,
            dkimPrivateKey: true,
          },
        },
        attachments: true,
        recipients: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }

  /**
   * Find email by reference - returns only API response fields
   */
  async findByReference(reference: string): Promise<any | null> {
    const emailQuery = Prisma.sql`
      SELECT
        E.reference AS id,
        COALESCE(E."to", '[]'::jsonb) as "to",
        E."from",
        E.created_at::text as "createdAt",
        E.subject,
        E.html,
        E.text,
        COALESCE(E.bcc, '[]'::jsonb) as bcc,
        COALESCE(E.cc, '[]'::jsonb) as cc,
        COALESCE(E.reply_to, '[]'::jsonb) as "replyTo",
        (
          SELECT er.type
          FROM email_recipients er
          LEFT JOIN email_events ee ON ee.email_recipient_id = er.id
          WHERE er.email_id = E.id
          ORDER BY ee.timestamp DESC
          LIMIT 1
        ) as "lastEvent",
        E.scheduled_at::text as "scheduledAt"
      FROM emails E
      WHERE E.reference = ${reference}
    `;

    const [result]: any[] = await prisma.$queryRaw(emailQuery);
    return result;
  }

  /**
   * Find all emails for a team
   */
  async findByTeamId(teamId: number): Promise<any[]> {
    return prisma.email.findMany({
      where: { teamId },
      include: {
        Domain: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Update email
   */
  async update(id: number, data: any): Promise<any> {
    return prisma.email.update({
      where: { id },
      data,
    });
  }

  /**
   * Update attachment
   */
  async updateAttachment(id: number, data: any): Promise<any> {
    return prisma.attachment.update({
      where: { id },
      data,
    });
  }

  /**
   * Count attachments with path URLs for an email
   */
  async countAttachmentsWithPathUrl(emailId: number): Promise<number> {
    return prisma.attachment.count({
      where: {
        emailId,
        path: { not: null },
      },
    });
  }

  /**
   * Find attachments that need downloading for an email
   * Returns attachments that have a path but no content yet
   */
  async findAttachmentsToDownload(emailId: number): Promise<any[]> {
    return prisma.attachment.findMany({
      where: {
        emailId,
        path: { not: null },
        content: null,
      },
    });
  }

  /**
   * Find attachments for sending via SES
   * Returns only the fields needed for email sending (filename, content, contentType)
   */
  async findAttachmentsForSending(emailId: number): Promise<{ filename: string; content: string; contentType: string }[]> {
    return prisma.$queryRaw<{ filename: string; content: string; contentType: string }[]>`
      SELECT
        filename,
        COALESCE(content, '') as content,
        COALESCE(content_type, 'application/octet-stream') as "contentType"
      FROM attachments
      WHERE email_id = ${emailId}
    `;
  }

  /**
   * Delete email
   */
  async delete(id: number): Promise<void> {
    await prisma.email.delete({
      where: { id },
    });
  }

  /**
   * Get email count for a team
   */
  async countByTeamId(teamId: number): Promise<number> {
    return prisma.email.count({
      where: { teamId },
    });
  }

  /**
   * Get email count by status for a team
   * Counts emails that have at least one recipient with the given status
   */
  async countByTeamIdAndStatus(teamId: number, status: EmailStatus): Promise<number> {
    const result = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(DISTINCT e.id)::int as count
      FROM emails e
      INNER JOIN email_recipients er ON er.email_id = e.id
      WHERE e.team_id = ${teamId}
      AND er.status = ${status}::email_status
    `;

    return Number(result[0].count);
  }


  /**
   * Find emails with filtering and pagination
   */
  async findWithFilter(filter: FindEmailsWithFilterData): Promise<{ data: any[]; total: number; offset: number; limit: number }> {
    const { teamId, keyword, status, domainId, dateFrom, dateTo, offset = 0, limit = 10 } = filter;

    const whereClause = Prisma.sql`
      WHERE E.team_id = ${teamId}
      AND (
        E.subject::text ILIKE CONCAT('%', ${keyword ?? ''}::text, '%')
        OR E."from"::text ILIKE CONCAT('%', ${keyword ?? ''}::text, '%')
        OR EXISTS (
          SELECT 1 FROM UNNEST(E."to") AS recipient
          WHERE recipient::text ILIKE CONCAT('%', ${keyword ?? ''}::text, '%')
        )
        OR COALESCE(${keyword}, NULL) IS NULL
      )
      AND (
        CASE
          WHEN ${status} = 'queued' THEN E.status = 'queued'
          WHEN ${status} = 'sent' THEN E.status = 'sent'
          WHEN ${status} = 'delivered' THEN E.status = 'delivered'
          WHEN ${status} = 'failed' THEN E.status = 'failed'
          WHEN ${status} = 'bounced' THEN E.status = 'bounced'
          ELSE TRUE
        END
      )
      AND (
        E.domain_id = ${domainId ?? 0}
        OR COALESCE(${domainId}, NULL) IS NULL
      )
      AND (
        E.created_at >= ${dateFrom ?? '1970-01-01'}::timestamp
        OR COALESCE(${dateFrom}, NULL) IS NULL
      )
      AND (
        E.created_at <= ${dateTo ?? '2099-12-31'}::timestamp
        OR COALESCE(${dateTo}, NULL) IS NULL
      )
    `;

    const retrieveEmailsQuery = Prisma.sql`
      SELECT
        E.reference AS id,
        COALESCE(E."to", '[]'::jsonb) as "to",
        E."from",
        E.created_at::text as "createdAt",
        E.subject,
        E.html,
        E.text,
        COALESCE(E.bcc, '[]'::jsonb) as bcc,
        COALESCE(E.cc, '[]'::jsonb) as cc,
        COALESCE(E.reply_to, '[]'::jsonb) as "replyTo",
        (
          SELECT ee.type
          FROM email_recipients er
          LEFT JOIN email_events ee ON ee.email_recipient_id = er.id
          WHERE er.email_id = E.id
          ORDER BY ee.timestamp DESC
          LIMIT 1
        ) as "lastEvent",
        E.scheduled_at::text as "scheduledAt"
      FROM emails E
      LEFT JOIN domains D ON E.domain_id = D.id
      ${whereClause}
      ORDER BY E.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const countEmailsQuery = Prisma.sql`
      SELECT COUNT(*)::int
      FROM emails E
      ${whereClause}
    `;

    const emails: any[] = await prisma.$queryRaw(retrieveEmailsQuery);
    const [{ count }]: { count: number }[] = await prisma.$queryRaw(countEmailsQuery);

    return {
      data: emails,
      total: count,
      offset,
      limit,
    };
  }

  /**
   * Get email statistics for a team
   */
  async getEmailStats(teamId: number, dateFrom?: Date, dateTo?: Date): Promise<any> {
    const whereClause: any = { teamId };

    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) whereClause.createdAt.gte = dateFrom;
      if (dateTo) whereClause.createdAt.lte = dateTo;
    }

    const [
      totalSent,
      totalDelivered,
      totalBounced,
      totalFailed,
      totalOpened,
      totalClicked,
    ] = await Promise.all([
      prisma.email.count({ where: { ...whereClause, status: EmailStatus.sent } }),
      prisma.email.count({ where: { ...whereClause, status: EmailStatus.delivered } }),
      prisma.email.count({ where: { ...whereClause, status: EmailStatus.bounced } }),
      prisma.email.count({ where: { ...whereClause, status: EmailStatus.failed } }),
      prisma.email.count({ where: { ...whereClause, opens: { gt: 0 } } }),
      prisma.email.count({ where: { ...whereClause, clicks: { gt: 0 } } }),
    ]);

    const total = totalSent + totalDelivered + totalBounced + totalFailed;

    return {
      total,
      sent: totalSent,
      delivered: totalDelivered,
      bounced: totalBounced,
      failed: totalFailed,
      opened: totalOpened,
      clicked: totalClicked,
      deliveryRate: total > 0 ? ((totalDelivered / total) * 100).toFixed(2) : '0.00',
      bounceRate: total > 0 ? ((totalBounced / total) * 100).toFixed(2) : '0.00',
      openRate: totalDelivered > 0 ? ((totalOpened / totalDelivered) * 100).toFixed(2) : '0.00',
      clickRate: totalDelivered > 0 ? ((totalClicked / totalDelivered) * 100).toFixed(2) : '0.00',
    };
  }


  /**
   * Find queued emails for sending
   * Note: Status is now tracked per recipient
   * This finds emails that have at least one queued recipient
   */
  async findQueuedEmails(limit: number = 100): Promise<any[]> {
    return prisma.email.findMany({
      where: {
        recipients: {
          some: {
            status: EmailStatus.queued,
          },
        },
      },
      include: {
        Domain: {
          select: {
            id: true,
            name: true,
            region: true,
            dkimSelector: true,
            dkimPrivateKey: true,
          },
        },
        attachments: true,
        recipients: {
          where: {
            status: EmailStatus.queued,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: limit,
    });
  }

  /**
   * Create multiple emails with attachments and recipients in a single transaction
   * Returns array of { id: reference } for successfully created emails
   */
  async createBatchEmailsWithAttachments(
    batchReference: string,
    emailsData: Array<{
      email: CreateEmailData;
      attachments?: CreateAttachmentData[];
    }>
  ): Promise<Array<{ id: string }>> {
    return prisma.$transaction(async (tx) => {
      // Create all emails with nested creates for attachments and recipients
      await Promise.all(
        emailsData.map(({ email: emailData, attachments = [] }) => {
          return tx.email.create({
            data: {
              batchReference,
              createdBy: emailData.createdBy,
              teamId: emailData.teamId,
              domainId: emailData.domainId,
              apiKeyId: emailData.apiKeyId,
              from: emailData.from,
              to: emailData.to,
              cc: emailData.cc,
              bcc: emailData.bcc,
              replyTo: emailData.replyTo,
              subject: emailData.subject,
              text: emailData.text,
              html: emailData.html,
              templateId: emailData.templateId,
              templateData: emailData.templateData,
              attachments: attachments.length > 0 ? {
                createMany: {
                  data: attachments,
                },
              } : undefined,
              recipients: {
                createMany: {
                  data: [
                    ...emailData.to.map(email => ({ recipient: email })),
                    ...(emailData.cc || []).map(email => ({ recipient: email })),
                    ...(emailData.bcc || []).map(email => ({ recipient: email })),
                  ],
                },
              },
            },
          });
        })
      );

      // Fetch all created emails by batch reference using raw SQL
      // Map reference AS id so service receives already-formatted data
      const createdEmails = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT reference AS id
        FROM emails
        WHERE batch_reference = ${batchReference}
        ORDER BY created_at ASC
      `;

      return createdEmails;
    });
  }

  /**
   * Find email IDs by batch reference for enqueueing
   * Returns array of internal email IDs (integer)
   */
  async findEmailIdsByBatchReference(batchReference: string): Promise<number[]> {
    const emails = await prisma.$queryRaw<Array<{ id: number }>>`
      SELECT id
      FROM emails
      WHERE batch_reference = ${batchReference}
      ORDER BY created_at ASC
    `;

    return emails.map(email => email.id);
  }

  /**
   * Update scheduledAt for an email - only if status is 'scheduled'
   * Returns the email reference as id or null if not found/not scheduled status
   */
  async updateScheduledAt(reference: string, scheduledAt: Date): Promise<{ id: string } | null> {
    const result = await prisma.$queryRaw<Array<{ id: string }>>`
      UPDATE emails e
      SET scheduled_at = ${scheduledAt}::timestamp
      WHERE e.reference = ${reference}
        AND EXISTS (
          SELECT 1 FROM email_recipients er
          WHERE er.email_id = e.id AND er.status = 'scheduled'::"EmailStatus"
        )
      RETURNING e.reference AS id
    `;

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Cancel scheduled email - removes scheduledAt and updates status from 'scheduled' to 'draft'
   * Returns the email reference as id or null if not found/not scheduled status
   */
  async cancelScheduledEmail(reference: string): Promise<{ id: string } | null> {
    const [result] = await prisma.$queryRaw<Array<{ id: string }>>`
      WITH updated_email AS (
        UPDATE emails e
        SET scheduled_at = NULL
        WHERE e.reference = ${reference}
          AND EXISTS (
            SELECT 1 FROM email_recipients er
            WHERE er.email_id = e.id AND er.status = 'scheduled'::"EmailStatus"
          )
        RETURNING e.id, e.reference
      ),
      updated_recipients AS (
        UPDATE email_recipients er
        SET status = 'draft'::"EmailStatus"
        FROM updated_email ue
        WHERE er.email_id = ue.id AND er.status = 'scheduled'::"EmailStatus"
      )
      SELECT reference AS id FROM updated_email
    `;

    return result;
  }

  /**
   * Find attachment by reference and email reference with team validation
   * Returns attachment details for API response
   * contentDisposition is calculated: 'inline' if contentId exists, otherwise 'attachment'
   */
  async findAttachmentByReference(attachmentReference: string, emailReference: string, teamId: number): Promise<any | null> {
    const attachmentQuery = Prisma.sql`
      SELECT
        a.reference AS id,
        a.filename,
        LENGTH(COALESCE(a.content, '')) AS size,
        a.content_type AS "contentType",
        a.content_id AS "contentId",
        CASE
          WHEN a.content_id IS NOT NULL THEN 'inline'
          ELSE 'attachment'
        END AS "contentDisposition",
        a.download_url AS "downloadUrl",
        a.expires_at::text AS "expiresAt"
      FROM attachments a
      INNER JOIN emails e ON e.id = a.email_id
      WHERE a.reference = ${attachmentReference}
        AND e.reference = ${emailReference}
        AND e.team_id = ${teamId}
    `;

    const [result]: any[] = await prisma.$queryRaw(attachmentQuery);
    return result;
  }

  /**
   * Find all attachments for an email by email reference with team validation
   * Returns array of attachment details for API response
   * contentDisposition is calculated: 'inline' if contentId exists, otherwise 'attachment'
   */
  async findAttachmentsByEmailReference(emailReference: string, teamId: number): Promise<any[]> {
    const attachmentsQuery = Prisma.sql`
      SELECT
        a.reference AS id,
        a.filename,
        LENGTH(COALESCE(a.content, '')) AS size,
        a.content_type AS "contentType",
        a.content_id AS "contentId",
        CASE
          WHEN a.content_id IS NOT NULL THEN 'inline'
          ELSE 'attachment'
        END AS "contentDisposition",
        a.download_url AS "downloadUrl",
        a.expires_at::text AS "expiresAt"
      FROM attachments a
      INNER JOIN emails e ON e.id = a.email_id
      WHERE e.reference = ${emailReference}
        AND e.team_id = ${teamId}
      ORDER BY a.created_at ASC
    `;

    const results: any[] = await prisma.$queryRaw(attachmentsQuery);
    return results;
  }
}
