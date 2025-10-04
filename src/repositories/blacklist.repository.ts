import { Injectable } from '@nestjs/common';
import { BlacklistType, BlacklistReason, BlacklistDuration } from '@prisma/client';
import prisma from '../common/prisma';
import { Prisma } from '@prisma/client';

@Injectable()
export class BlacklistRepository {
  // Standard CRUD methods for admin operations
  async findAll(filter: any = {}): Promise<{ blacklists: any[]; total: number }> {
    const { offset, limit, type, isActive, keyword } = filter;

    const whereClause = Prisma.sql`
      WHERE (
        B.value::text ILIKE CONCAT('%', ${keyword}::text, '%') 
        OR B.description::text ILIKE CONCAT('%', ${keyword}::text, '%')
        OR COALESCE(${keyword}, NULL) IS NULL
      )
      AND (B.type::text = ${type}::text OR COALESCE(${type}, NULL) IS NULL)
      AND (B.is_active = ${isActive}::boolean OR COALESCE(${isActive}, NULL) IS NULL)
    `;

    const retrieveBlacklistsQuery = Prisma.sql`
      SELECT 
        B.id,
        B.type,
        B.value,
        B.reason,
        B.duration,
        B.expires_at as "expiresAt",
        B.description,
        B.metadata,
        B.is_active as "isActive",
        B.created_at as "createdAt",
        B.updated_at as "updatedAt"
      FROM blacklists B
      ${whereClause} 
      ORDER BY B.created_at DESC 
      LIMIT ${limit} 
      OFFSET ${offset}
    `;

    const countBlacklistsQuery = Prisma.sql`
      SELECT COUNT(*)::int 
      FROM blacklists B
      ${whereClause}
    `;

    const blacklists: any[] = await prisma.$queryRaw(retrieveBlacklistsQuery);
    const [{ count }]: { count: number }[] = await prisma.$queryRaw(countBlacklistsQuery);

    return {
      blacklists,
      total: count,
    };
  }

  async findById(id: number): Promise<any | null> {
    return prisma.blacklist.findUnique({
      where: { id },
    });
  }

  async create(data: { type: BlacklistType; value: string; reason: BlacklistReason; duration: BlacklistDuration; expiresAt?: Date; isActive?: boolean }): Promise<any> {
    return prisma.blacklist.create({
      data: {
        type: data.type,
        value: data.value,
        reason: data.reason,
        duration: data.duration,
        expiresAt: data.expiresAt,
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(id: number, data: any): Promise<any> {
    return prisma.blacklist.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: number): Promise<void> {
    await prisma.blacklist.delete({
      where: { id },
    });
  }

  // Existing methods
  async findBlacklist(type: BlacklistType, value: string): Promise<any | null> {
    return prisma.blacklist.findUnique({
      where: {
        type_value: {
          type,
          value,
        },
      },
    });
  }

  async cleanupExpiredBlacklists(): Promise<number> {
    const result = await prisma.blacklist.updateMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });
    return result.count;
  }

  async getBlacklistStats(): Promise<any> {
    const result = await prisma.$queryRaw<{
      total_blacklists: number;
      active_blacklists: number;
      expired_blacklists: number;
      by_type: Record<string, number>;
      by_reason: Record<string, number>;
    }[]>`
      SELECT 
        COUNT(*) as total_blacklists,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_blacklists,
        COUNT(CASE WHEN expires_at < NOW() AND is_active = true THEN 1 END) as expired_blacklists,
        json_object_agg(type, count) FILTER (WHERE type IS NOT NULL) as by_type,
        json_object_agg(reason, count) FILTER (WHERE reason IS NOT NULL) as by_reason
      FROM (
        SELECT 
          type,
          reason,
          COUNT(*) as count
        FROM blacklists 
        WHERE is_active = true
        GROUP BY GROUPING SETS ((type), (reason))
      ) grouped_data
    `;

    const stats = result[0];
    return {
      totalBlacklists: Number(stats?.total_blacklists || 0),
      activeBlacklists: Number(stats?.active_blacklists || 0),
      expiredBlacklists: Number(stats?.expired_blacklists || 0),
      byType: stats?.by_type || {},
      byReason: stats?.by_reason || {},
    };
  }
} 