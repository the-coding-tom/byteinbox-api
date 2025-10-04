import { Injectable } from '@nestjs/common';
import prisma from '../common/prisma';
import { Prisma } from '@prisma/client';

@Injectable()
export class ApiKeyRepository {
  async create(data: {
    key: string;
    name: string;
    description?: string;
    userId: number;
    scopes: string[];
    expiresAt?: Date;
  }): Promise<any> {
    return prisma.apiKey.create({
      data: {
        key: data.key,
        name: data.name,
        description: data.description,
        userId: data.userId,
        scopes: data.scopes,
        expiresAt: data.expiresAt,
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

  async findByUserId(userId: number): Promise<any[]> {
    return prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUserIdAndName(userId: number, name: string): Promise<any | null> {
    return prisma.apiKey.findFirst({
      where: {
        userId,
        name,
      },
    });
  }

  async findWithPagination(filter: {
    userId?: number;
    isActive?: boolean;
    keyword?: string;
    offset: number;
    limit: number;
  }): Promise<{ data: any[]; meta: any }> {
    const { userId, isActive, keyword, offset, limit } = filter;

    const whereClause = Prisma.sql`
      WHERE (
        AK.name::text ILIKE CONCAT('%', ${keyword}::text, '%') 
        OR AK.description::text ILIKE CONCAT('%', ${keyword}::text, '%')
        OR COALESCE(${keyword}, NULL) IS NULL
      )
      AND (AK.user_id = ${userId}::int OR COALESCE(${userId}, NULL) IS NULL)
      AND (AK.is_active = ${isActive}::boolean OR COALESCE(${isActive}, NULL) IS NULL)
    `;

    const retrieveApiKeysQuery = Prisma.sql`
      SELECT 
        AK.id,
        AK.key,
        AK.name,
        AK.description,
        AK.user_id as "userId",
        AK.scopes,
        AK.is_active as "isActive",
        AK.expires_at as "expiresAt",
        AK.last_used_at as "lastUsedAt",
        AK.created_at as "createdAt",
        AK.updated_at as "updatedAt",
        U.id as "user.id",
        U.email as "user.email",
        U.first_name as "user.firstName",
        U.last_name as "user.lastName"
      FROM api_keys AK
      LEFT JOIN users U ON AK.user_id = U.id
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
      description?: string;
      scopes?: string[];
      isActive?: boolean;
      expiresAt?: Date;
      key?: string;
    },
  ): Promise<any> {
    return prisma.apiKey.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        scopes: data.scopes,
        isActive: data.isActive,
        expiresAt: data.expiresAt,
        key: data.key,
      },
    });
  }

  async updateLastUsed(id: number): Promise<void> {
    await prisma.apiKey.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  }

  async delete(id: number): Promise<void> {
    await prisma.apiKey.delete({
      where: { id },
    });
  }

  async createLog(data: {
    apiKeyId: number;
    action: string;
    endpoint?: string;
    ipAddress?: string;
    userAgent?: string;
    requestBody?: string;
    responseStatus?: number;
  }): Promise<void> {
    await prisma.apiKeyLog.create({
      data: {
        apiKeyId: data.apiKeyId,
        action: data.action,
        endpoint: data.endpoint,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        requestBody: data.requestBody,
        responseStatus: data.responseStatus,
      },
    });
  }

  async getLogs(apiKeyId: number, limit: number = 100): Promise<any[]> {
    return prisma.apiKeyLog.findMany({
      where: { apiKeyId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getStats(apiKeyId: number): Promise<{
    totalRequests: number;
    lastUsedAt: Date | null;
    errorRate: number;
    avgResponseTime: number;
  }> {
    const result = await prisma.$queryRaw<
      {
        total_requests: number;
        last_used_at: Date | null;
        error_count: number;
      }[]
    >`
      SELECT 
        COALESCE(COUNT(akl.id), 0) as total_requests,
        ak.last_used_at,
        COALESCE(COUNT(CASE WHEN akl.response_status >= 400 THEN 1 END), 0) as error_count
      FROM api_keys ak
      LEFT JOIN api_key_logs akl ON ak.id = akl.api_key_id
      WHERE ak.id = ${apiKeyId}
      GROUP BY ak.id, ak.last_used_at
    `;

    const stats = result[0];
    const totalRequests = Number(stats?.total_requests || 0);
    const errorCount = Number(stats?.error_count || 0);
    const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;

    return {
      totalRequests,
      lastUsedAt: stats?.last_used_at || null,
      errorRate,
      avgResponseTime: 0, // Not available in current schema
    };
  }
}
