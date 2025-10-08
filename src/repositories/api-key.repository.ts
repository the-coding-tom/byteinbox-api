import { Injectable } from '@nestjs/common';
import prisma from '../common/prisma';
import { Prisma } from '@prisma/client';

@Injectable()
export class ApiKeyRepository {
  // Note: description, userId, scopes, expiresAt removed from ApiKey model
  // Added: teamId, permission, domain, status
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
    });
  }

  async findByKey(key: string): Promise<any | null> {
    return prisma.apiKey.findUnique({
      where: { key },
    });
  }

  // Note: userId field doesn't exist - use teamId or createdBy instead
  async findByUserId(userId: number): Promise<any[]> {
    return prisma.apiKey.findMany({
      where: { createdBy: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findWithPagination(filter: {
    teamId?: string;
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
      AND (AK.team_id = ${teamId}::text OR COALESCE(${teamId}, NULL) IS NULL)
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
      data: {
        name: data.name,
        permission: data.permission,
        domain: data.domain,
        status: data.status,
        key: data.key,
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
    ipAddress?: string;
    userAgent?: string;
    requestBody?: any;
    responseBody?: any;
  }): Promise<void> {
    // API key logs are tracked via Log model in new schema
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

  async getLogs(apiKeyId: number, limit: number = 100): Promise<any[]> {
    return prisma.log.findMany({
      where: { apiKeyId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }
}
