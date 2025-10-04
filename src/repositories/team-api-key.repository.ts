import { Injectable } from '@nestjs/common';
import prisma from '../common/prisma';
import { Prisma } from '@prisma/client';

@Injectable()
export class TeamApiKeyRepository {
  async create(data: {
    key: string;
    name: string;
    description?: string;
    teamId: number;
    scopes: string[];
    expiresAt?: Date;
    createdBy: number;
  }): Promise<any> {
    return prisma.teamApiKey.create({
      data: {
        key: data.key,
        name: data.name,
        description: data.description,
        teamId: data.teamId,
        scopes: data.scopes,
        expiresAt: data.expiresAt,
        createdBy: data.createdBy,
      },
    });
  }

  async findById(id: number): Promise<any | null> {
    return prisma.teamApiKey.findUnique({
      where: { id },
      include: {
        team: true,
        createdByUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async findByKey(key: string): Promise<any | null> {
    return prisma.teamApiKey.findUnique({
      where: { key },
      include: {
        team: true,
        createdByUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async findByTeamId(teamId: number): Promise<any[]> {
    return prisma.teamApiKey.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
      include: {
        createdByUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async findByTeamIdAndName(teamId: number, name: string): Promise<any | null> {
    return prisma.teamApiKey.findFirst({
      where: {
        teamId,
        name,
      },
    });
  }

  async findByTeamIdWithPagination(filter: {
    teamId: number;
    isActive?: boolean;
    keyword?: string;
    offset: number;
    limit: number;
  }): Promise<{ data: any[]; meta: any }> {
    const { teamId, isActive, keyword, offset, limit } = filter;

    const whereClause = Prisma.sql`
      WHERE (
        TAK.name::text ILIKE CONCAT('%', ${keyword}::text, '%') 
        OR TAK.description::text ILIKE CONCAT('%', ${keyword}::text, '%')
        OR COALESCE(${keyword}, NULL) IS NULL
      )
      AND TAK.team_id = ${teamId}::int
      AND (TAK.is_active = ${isActive}::boolean OR COALESCE(${isActive}, NULL) IS NULL)
    `;

    const retrieveApiKeysQuery = Prisma.sql`
      SELECT 
        TAK.id,
        TAK.key,
        TAK.name,
        TAK.description,
        TAK.team_id as "teamId",
        TAK.scopes,
        TAK.is_active as "isActive",
        TAK.expires_at as "expiresAt",
        TAK.last_used_at as "lastUsedAt",
        TAK.created_at as "createdAt",
        TAK.updated_at as "updatedAt",
        TAK.created_by as "createdBy",
        U.id as "createdByUser.id",
        U.email as "createdByUser.email",
        U.first_name as "createdByUser.firstName",
        U.last_name as "createdByUser.lastName"
      FROM team_api_keys TAK
      LEFT JOIN users U ON TAK.created_by = U.id
      ${whereClause} 
      ORDER BY TAK.created_at DESC 
      LIMIT ${limit} 
      OFFSET ${offset}
    `;

    const countApiKeysQuery = Prisma.sql`
      SELECT COUNT(*)::int 
      FROM team_api_keys TAK
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
      description?: string;
      scopes?: string[];
      isActive?: boolean;
      expiresAt?: Date;
      key?: string;
    },
  ): Promise<any> {
    return prisma.teamApiKey.update({
      where: { id },
      data,
      include: {
        team: true,
        createdByUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async updateLastUsed(id: number): Promise<void> {
    await prisma.teamApiKey.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  }

  async delete(id: number): Promise<void> {
    await prisma.teamApiKey.delete({
      where: { id },
    });
  }

  async createLog(data: {
    teamApiKeyId: number;
    action: string;
    endpoint?: string;
    ipAddress?: string;
    userAgent?: string;
    requestBody?: string;
    responseStatus?: number;
  }): Promise<void> {
    await prisma.teamApiKeyLog.create({
      data: {
        teamApiKeyId: data.teamApiKeyId,
        action: data.action,
        endpoint: data.endpoint,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        requestBody: data.requestBody,
        responseStatus: data.responseStatus,
      },
    });
  }

  async getApiKeyLogs(teamApiKeyId: number, limit: number = 100): Promise<any[]> {
    return prisma.teamApiKeyLog.findMany({
      where: { teamApiKeyId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getApiKeyStats(teamApiKeyId: number): Promise<{
    totalRequests: number;
    lastUsedAt: Date | null;
  }> {
    const logs = await prisma.teamApiKeyLog.findMany({
      where: { teamApiKeyId },
      select: {
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      totalRequests: logs.length,
      lastUsedAt: logs.length > 0 ? logs[0].createdAt : null,
    };
  }
} 