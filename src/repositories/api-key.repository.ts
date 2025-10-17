import { Injectable } from '@nestjs/common';
import { Prisma, ApiKeyStatus } from '@prisma/client';
import prisma from '../common/prisma';
import {
  CreateApiKeyData,
  UpdateApiKeyData,
  FindByTeamIdWithPaginationFilter,
} from './entities/api-key.entity';

@Injectable()
export class ApiKeyRepository {
  async create(data: CreateApiKeyData): Promise<any> {
    return prisma.apiKey.create({
      data: {
        key: data.key,
        name: data.name,
        teamId: data.teamId,
        permission: data.permission,
        domain: data.domain,
        createdBy: data.createdBy,
        status: ApiKeyStatus.active,
      },
      select: {
        id: true,
        key: true,
        name: true,
        permission: true,
        domain: true,
        status: true,
        lastUsed: true,
        createdAt: true,
      },
    });
  }

  async findById(id: number): Promise<any | null> {
    const query = Prisma.sql`
      SELECT 
        AK.id,
        CONCAT(LEFT(AK.key, 11), '...') as key,
        AK.name,
        AK.team_id as "teamId",
        AK.permission,
        AK.domain,
        AK.status,
        AK.last_used as "lastUsed",
        AK.created_at as "createdAt",
        AK.created_by as "createdBy",
        T.id as "Team.id",
        T.reference as "Team.reference",
        T.name as "Team.name",
        T.slug as "Team.slug",
        U.id as "Creator.id",
        U.email as "Creator.email",
        U.name as "Creator.name",
        U.first_name as "Creator.firstName",
        U.last_name as "Creator.lastName"
      FROM api_keys AK
      LEFT JOIN teams T ON AK.team_id = T.id
      LEFT JOIN users U ON AK.created_by = U.id
      WHERE AK.id = ${id}
    `;

    const results = await prisma.$queryRaw(query) as any[];
    return results[0];
  }


  async findByKeyWithRelations(key: string): Promise<any | null> {
    return prisma.apiKey.findUnique({
      where: { key },
      include: {
        Team: true,
        Creator: {
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

  async findByTeamIdWithPagination(filter: FindByTeamIdWithPaginationFilter): Promise<{ data: any[]; total: number; offset: number; limit: number }> {
    const { offset, limit } = filter;

    const whereClause = Prisma.sql`
      WHERE (
        AK.name::text ILIKE CONCAT('%', ${filter.keyword}::text, '%') 
        OR COALESCE(${filter.keyword}, NULL) IS NULL
      )
      AND AK.team_id = ${filter.teamId}
      AND (AK.status = ${filter.status} OR COALESCE(${filter.status}, NULL) IS NULL)
    `;

    const retrieveApiKeysQuery = Prisma.sql`
      SELECT 
        AK.id,
        CONCAT(LEFT(AK.key, 11), '...') as key,
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
      total: count,
      offset,
      limit,
    };
  }

  async update(id: number, data: UpdateApiKeyData): Promise<any> {
    return prisma.apiKey.update({
      where: { id },
      data,
      include: {
        Team: true,
        Creator: {
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
}
