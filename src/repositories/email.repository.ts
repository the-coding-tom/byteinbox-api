import { Injectable } from '@nestjs/common';
import { EmailStatus, Prisma } from '@prisma/client';
import prisma from '../common/prisma';
import {
  CreateEmailData,
  CreateAttachmentData,
  CreateEmailEventData,
  FindEmailsWithFilterData,
} from './entities/email.entity';

@Injectable()
export class EmailRepository {
  /**
   * Create a new email with optional attachments in a single atomic transaction
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
        status: emailData.status,
        attachments: attachments.length > 0 ? {
          createMany: {
            data: attachments,
          },
        } : undefined,
      },
      include: {
        attachments: true,
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
        events: {
          orderBy: {
            timestamp: 'desc',
          },
        },
      },
    });
  }

  /**
   * Find email by reference with all relations
   */
  async findByReference(reference: string): Promise<any | null> {
    const emailQuery = Prisma.sql`
      SELECT
        E.reference,
        E."from",
        COALESCE(E."to", '[]'::jsonb) as "to",
        COALESCE(E.cc, '[]'::jsonb) as cc,
        COALESCE(E.bcc, '[]'::jsonb) as bcc,
        COALESCE(E.reply_to, '[]'::jsonb) as "replyTo",
        E.subject,
        E.text,
        E.html,
        E.status,
        E.opens,
        E.clicks,
        E.last_opened::text as "lastOpened",
        E.last_clicked::text as "lastClicked",
        E.sent_at::text as "sentAt",
        E.delivered_at::text as "deliveredAt",
        E.created_at::text as "createdAt",
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'type', EE.type,
                'timestamp', EE.timestamp::text,
                'userAgent', EE.user_agent,
                'ipAddress', EE.ip_address,
                'location', EE.location
              )
            )
            FROM email_events EE
            WHERE EE.email_id = E.id
            ORDER BY EE.timestamp DESC
          ),
          '[]'::json
        ) as events,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', EA.id::text,
                'filename', EA.filename,
                'type', EA.type,
                'size', CEIL(LENGTH(EA.content) * 0.75)
              )
            )
            FROM email_attachments EA
            WHERE EA.email_id = E.id
          ),
          '[]'::json
        ) as attachments
      FROM emails E
      WHERE E.reference = ${reference}
    `;

    const result: any[] = await prisma.$queryRaw(emailQuery);
    return result[0] || null;
  }

  /**
   * Find email by message ID
   */
  async findByMessageId(messageId: string): Promise<any | null> {
    return prisma.email.findFirst({
      where: { messageId },
      include: {
        Domain: true,
        attachments: true,
        events: true,
      },
    });
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
   * Update email by message ID
   */
  async updateByMessageId(messageId: string, data: any): Promise<any> {
    // messageId is not unique in schema, so we need to use updateMany or findFirst + update
    const email = await prisma.email.findFirst({
      where: { messageId },
    });

    if (!email) {
      throw new Error('Email not found');
    }

    return prisma.email.update({
      where: { id: email.id },
      data,
    });
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
   */
  async countByTeamIdAndStatus(teamId: number, status: EmailStatus): Promise<number> {
    return prisma.email.count({
      where: {
        teamId,
        status,
      },
    });
  }

  /**
   * Create email event
   */
  async createEmailEvent(data: CreateEmailEventData): Promise<any> {
    return prisma.emailEvent.create({
      data: {
        emailId: data.emailId,
        type: data.eventType,
        bounceType: data.bounceType,
        bounceSubType: data.bounceSubType,
        complaintFeedbackType: data.complaintFeedbackType,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
        location: data.location,
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
      },
    });
  }

  /**
   * Find email events by email ID
   */
  async findEventsByEmailId(emailId: number): Promise<any[]> {
    return prisma.emailEvent.findMany({
      where: { emailId },
      orderBy: {
        timestamp: 'desc',
      },
    });
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
        E.reference,
        E."from",
        CASE 
          WHEN array_length(E."to", 1) > 0 THEN E."to"[1]
          ELSE E."to"::text
        END as "to",
        E.subject,
        E.status,
        COALESCE(E.sent_at::text, E.created_at::text) as "sentAt",
        E.opens,
        E.clicks
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
   * Increment email opens count
   */
  async incrementOpens(emailId: number): Promise<any> {
    return prisma.email.update({
      where: { id: emailId },
      data: {
        opens: { increment: 1 },
        lastOpened: new Date(),
      },
    });
  }

  /**
   * Increment email clicks count
   */
  async incrementClicks(emailId: number): Promise<any> {
    return prisma.email.update({
      where: { id: emailId },
      data: {
        clicks: { increment: 1 },
        lastClicked: new Date(),
      },
    });
  }

  /**
   * Find queued emails for sending
   */
  async findQueuedEmails(limit: number = 100): Promise<any[]> {
    return prisma.email.findMany({
      where: {
        status: EmailStatus.queued,
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
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: limit,
    });
  }
}
