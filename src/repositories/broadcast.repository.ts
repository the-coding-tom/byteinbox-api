import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import prisma from '../common/prisma';
import { CreateBroadcastData } from './entities/broadcast.entity';

@Injectable()
export class BroadcastRepository {
  /**
   * Create a new broadcast
   */
  async create(data: CreateBroadcastData): Promise<{ reference: string }> {
    const broadcast = await prisma.broadcast.create({
      data: {
        teamId: data.teamId,
        createdBy: data.createdBy,
        audienceId: data.audienceId,
        from: data.from,
        subject: data.subject,
        replyTo: data.replyTo || [],
        html: data.html,
        text: data.text,
        name: data.name,
        scheduledAt: data.scheduledAt,
      },
      select: {
        reference: true,
      },
    });

    return { reference: broadcast.reference };
  }

  /**
   * Find broadcast by ID
   */
  async findById(id: number, teamId: number): Promise<any | null> {
    return prisma.broadcast.findFirst({
      where: {
        id,
        teamId,
      },
      include: {
        Audience: true,
      },
    });
  }

  /**
   * Find broadcast by reference (CUID)
   */
  async findByReference(reference: string, teamId: number): Promise<any | null> {
    const query = Prisma.sql`
      SELECT
        b.id,
        b.reference,
        b.name,
        b.audience_id AS "audienceId",
        b.from,
        b.subject,
        b.reply_to AS "replyTo",
        b.html,
        b.text,
        b.status,
        b.created_at AS "createdAt",
        b.scheduled_at AS "scheduledAt",
        b.sent_at AS "sentAt"
      FROM broadcasts b
      WHERE b.reference = ${reference}
      AND b.team_id = ${teamId}
      LIMIT 1
    `;

    const broadcasts: any[] = await prisma.$queryRaw(query);
    return broadcasts.length > 0 ? broadcasts[0] : null;
  }

  /**
   * Update broadcast
   */
  async update(id: number, data: any): Promise<{ reference: string }> {
    const broadcast = await prisma.broadcast.update({
      where: { id },
      data,
      select: {
        reference: true,
      },
    });

    return { reference: broadcast.reference };
  }

  /**
   * Delete broadcast
   */
  async delete(id: number): Promise<void> {
    await prisma.broadcast.delete({
      where: { id },
    });
  }

  /**
   * Find broadcasts with filters
   */
  async findWithFilter(teamId: number, filter: any): Promise<{ data: any[]; total: number }> {
    const { status, offset = 0, limit = 10 } = filter;

    const whereClause = Prisma.sql`
      WHERE b.team_id = ${teamId}
      AND (
        b.status::text = ${status ?? ''}::text
        OR COALESCE(${status}, NULL) IS NULL
      )
    `;

    const query = Prisma.sql`
      SELECT
        b.reference AS id,
        a.reference AS "audienceId",
        b.status,
        b.created_at AS "createdAt",
        b.scheduled_at AS "scheduledAt",
        b.sent_at AS "sentAt"
      FROM broadcasts b
      LEFT JOIN audiences a ON b.audience_id = a.id
      ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const countQuery = Prisma.sql`
      SELECT COUNT(*)::int
      FROM broadcasts b
      ${whereClause}
    `;

    const broadcasts: any[] = await prisma.$queryRaw(query);
    const [{ count }]: { count: number }[] = await prisma.$queryRaw(countQuery);

    return {
      data: broadcasts,
      total: count,
    };
  }

  /**
   * Find scheduled broadcasts that are ready to be sent
   */
  async findScheduledBroadcastsReadyToSend(): Promise<any[]> {
    return prisma.broadcast.findMany({
      where: {
        status: 'scheduled',
        scheduledAt: {
          lte: new Date(),
        },
      },
      select: {
        id: true,
        teamId: true,
        reference: true,
      },
    });
  }
}
