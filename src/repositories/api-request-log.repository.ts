import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import prisma from '../common/prisma';

export interface CreateApiRequestLogData {
  teamId: number;
  apiKeyId?: number | null;
  endpoint: string;
  httpMethod: string;
  statusCode: number;
  responseTime: number;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestBody?: any;
  responseBody?: any;
  errorMessage?: string | null;
  errorCode?: string | null;
}

@Injectable()
export class ApiRequestLogRepository {
  async create(data: CreateApiRequestLogData): Promise<any> {
    return prisma.apiRequestLog.create({
      data,
    });
  }

  async findByTeam(teamId: number, offset: number, limit: number): Promise<any[]> {
    return prisma.apiRequestLog.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });
  }

  async countByTeam(teamId: number): Promise<number> {
    return prisma.apiRequestLog.count({
      where: { teamId },
    });
  }

  async findById(id: string): Promise<any | null> {
    return prisma.apiRequestLog.findUnique({
      where: { id },
      include: {
        Team: true,
        ApiKey: true,
      },
    });
  }

  async findByTeamIdWithPagination(filter: {
    teamId: number;
    statusCode?: number;
    httpMethod?: string;
    endpoint?: string;
    startDate?: string;
    endDate?: string;
    apiKeyId?: number;
    offset: number;
    limit: number;
  }): Promise<{ data: any[]; total: number; offset: number; limit: number }> {
    const { offset, limit } = filter;

    const whereClause = Prisma.sql`
      WHERE (
        ARL.endpoint::text ILIKE CONCAT('%', ${filter.endpoint}::text, '%') 
        OR COALESCE(${filter.endpoint}, NULL) IS NULL
      )
      AND ARL.team_id = ${filter.teamId}
      AND (ARL.status_code = ${filter.statusCode} OR COALESCE(${filter.statusCode}, NULL) IS NULL)
      AND (ARL.http_method = ${filter.httpMethod} OR COALESCE(${filter.httpMethod}, NULL) IS NULL)
      AND (ARL.api_key_id = ${filter.apiKeyId} OR COALESCE(${filter.apiKeyId}, NULL) IS NULL)
      AND (ARL.created_at >= ${filter.startDate}::timestamp OR COALESCE(${filter.startDate}, NULL) IS NULL)
      AND (ARL.created_at <= ${filter.endDate}::timestamp OR COALESCE(${filter.endDate}, NULL) IS NULL)
    `;

    const retrieveLogsQuery = Prisma.sql`
      SELECT 
        ARL.reference as id,
        ARL.endpoint,
        ARL.status_code as status,
        ARL.http_method as "httpMethod",
        ARL.created_at as "createdAt"
      FROM api_request_logs ARL
      ${whereClause} 
      ORDER BY ARL.created_at DESC 
      LIMIT ${limit} 
      OFFSET ${offset}
    `;

    const countLogsQuery = Prisma.sql`
      SELECT COUNT(*)::int 
      FROM api_request_logs ARL
      ${whereClause}
    `;

    const logs: any[] = await prisma.$queryRaw(retrieveLogsQuery);
    const [{ count }]: { count: number }[] = await prisma.$queryRaw(countLogsQuery);

    return {
      data: logs,
      total: count,
      offset,
      limit,
    };
  }

  async findByIdWithRelations(id: string): Promise<any | null> {
    const query = Prisma.sql`
      SELECT 
        ARL.reference as id,
        ARL.endpoint,
        ARL.http_method as "httpMethod",
        ARL.created_at as "createdAt",
        ARL.user_agent as "userAgent",
        ARL.status_code as status,
        ARL.response_body as "responseBody",
        ARL.request_body as "requestBody"
      FROM api_request_logs ARL
      WHERE ARL.reference = ${id}
    `;

    const results = await prisma.$queryRaw(query) as any[];
    return results[0];
  }
}

