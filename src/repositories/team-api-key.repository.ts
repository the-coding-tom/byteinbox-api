import { Injectable } from '@nestjs/common';
import prisma from '../common/prisma';
import { Prisma } from '@prisma/client';

@Injectable()
export class TeamApiKeyRepository {
  // Note: teamApiKey model doesn't exist - using apiKey model instead
  async create(data: {
    key: string;
    name: string;
    teamId: number;
    permission: string;
    domain?: string;
    createdBy?: number;
  }): Promise<any> {
    return prisma.apiKey.create({
      data: {
        key: data.key,
        name: data.name,
        teamId: data.teamId,
        permission: data.permission,
        domain: data.domain,
        createdBy: data.createdBy,
        status: 'active',
      },
    });
  }

  async findById(id: number): Promise<any | null> {
    return prisma.apiKey.findUnique({
      where: { id },
      include: {
        team: true,
        creator: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async findByKey(key: string): Promise<any | null> {
    return prisma.apiKey.findUnique({
      where: { key },
      include: {
        team: true,
        creator: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async findByTeamId(teamId: number): Promise<any[]> {
    return prisma.apiKey.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async findByTeamIdAndName(teamId: number, name: string): Promise<any | null> {
    return prisma.apiKey.findFirst({
      where: {
        teamId,
        name,
      },
    });
  }

  async findByTeamIdWithPagination(filter: {
    teamId: number;
    status?: string;
    keyword?: string;
    offset: number;
    limit: number;
  }): Promise<{ data: any[]; meta: any }> {
    const { teamId, status, keyword, offset, limit } = filter;

    const whereClause = Prisma.sql`
      WHERE (
        AK.name::text ILIKE CONCAT('%', ${keyword}::text, '%') 
        OR COALESCE(${keyword}, NULL) IS NULL
      )
      AND AK.team_id = ${teamId}::text
      AND (AK.status = ${status}::text OR COALESCE(${status}, NULL) IS NULL)
    `;

    const retrieveApiKeysQuery = Prisma.sql`
      SELECT 
        AK.id,
        AK.key,
        AK.name,
        AK.team_id as "teamId",
        AK.permission,
        AK.domain,
        AK.status,
        AK.last_used as "lastUsed",
        AK.created_at as "createdAt",
        AK.created_by as "createdBy"
      FROM api_keys AK
      ${whereClause} 
      ORDER BY AK.created_at DESC 
      LIMIT ${limit} 
      OFFSET ${offset}
    `;

    const countApiKeysQuery = Prisma.sql`
      SELECT COUNT(*)::int 
      FROM api_keys AK
      ${whereClause}
    `;

    const apiKeys: any[] = await prisma.$queryRaw(retrieveApiKeysQuery);
    const [{ count }]: { count: number }[] = await prisma.$queryRaw(countApiKeysQuery);

    return {
      data: apiKeys,
      meta: {
        total: count,
        page: Math.floor(offset / limit) + 1,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async update(
    id: number,
    data: {
      name?: string;
      permission?: string;
      domain?: string;
      status?: string;
      key?: string;
    },
  ): Promise<any> {
    return prisma.apiKey.update({
      where: { id },
      data,
      include: {
        team: true,
        creator: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async updateLastUsed(id: number): Promise<void> {
    await prisma.apiKey.update({
      where: { id },
      data: { lastUsed: new Date() },
    });
  }

  async delete(id: number): Promise<void> {
    await prisma.apiKey.delete({
      where: { id },
    });
  }

  async createLog(data: {
    apiKeyId: number;
    endpoint: string;
    method: string;
    status: string;
    userAgent?: string;
    requestBody?: any;
    responseBody?: any;
  }): Promise<void> {
    // Use Log model instead of teamApiKeyLog
    await prisma.log.create({
      data: {
        apiKeyId: data.apiKeyId,
        endpoint: data.endpoint,
        method: data.method,
        status: data.status,
        userAgent: data.userAgent,
        requestBody: data.requestBody,
        responseBody: data.responseBody,
      },
    });
  }
} 