import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import prisma from '../common/prisma';
import { FindAudiencesWithFilterData, AudienceData, CreateAudienceData } from './entities/audience.entity';

@Injectable()
export class AudienceRepository {
  /**
   * Create a new audience
   */
  async create(data: CreateAudienceData): Promise<AudienceData> {
    const audience = await prisma.audience.create({
      data: {
        name: data.name,
        teamId: data.teamId,
        createdBy: data.createdBy,
        type: data.type || 'custom',
      },
      select: {
        id: true,
        reference: true,
        name: true,
      },
    });

    return {
      id: audience.id,
      reference: audience.reference,
      name: audience.name,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Find audience by reference (CUID)
   */
  async findByReference(reference: string, teamId: number): Promise<AudienceData | null> {
    const audience = await prisma.audience.findFirst({
      where: {
        reference,
        teamId,
      },
      select: {
        id: true,
        reference: true,
        name: true,
        createdAt: true,
      },
    });

    if (!audience) {
      return null;
    }

    return {
      id: audience.id,
      reference: audience.reference,
      name: audience.name,
      createdAt: audience.createdAt.toISOString(),
    };
  }

  /**
   * Find audiences with filtering and pagination
   */
  async findWithFilter(filter: FindAudiencesWithFilterData): Promise<{ data: AudienceData[]; total: number; offset: number; limit: number }> {
    const { teamId, keyword, type, offset = 0, limit = 10 } = filter;

    const whereClause = Prisma.sql`
      WHERE A.team_id = ${teamId}
      AND (
        A.name::text ILIKE CONCAT('%', ${keyword ?? ''}::text, '%')
        OR COALESCE(${keyword}, NULL) IS NULL
      )
      AND (
        A.type = ${type}
        OR COALESCE(${type}, NULL) IS NULL
      )
    `;

    const retrieveAudiencesQuery = Prisma.sql`
      SELECT
        A.reference as id,
        A.name,
        A.created_at::text as "createdAt"
      FROM audiences A
      ${whereClause}
      ORDER BY A.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const countAudiencesQuery = Prisma.sql`
      SELECT COUNT(A.id)::int as count
      FROM audiences A
      ${whereClause}
    `;

    const audiences: AudienceData[] = await prisma.$queryRaw(retrieveAudiencesQuery);
    const [{ count }]: { count: number }[] = await prisma.$queryRaw(countAudiencesQuery);

    return {
      data: audiences,
      total: count,
      offset,
      limit,
    };
  }

  /**
   * Delete audience by reference
   */
  async delete(reference: string, teamId: number): Promise<void> {
    await prisma.audience.deleteMany({
      where: {
        reference,
        teamId,
      },
    });
  }
}
