import { Injectable } from '@nestjs/common';
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
}

