import { Injectable } from '@nestjs/common';
import { BlacklistType } from '@prisma/client';
import prisma from '../common/prisma';
import { Prisma } from '@prisma/client';

@Injectable()
export class BlacklistRepository {
  // Standard CRUD methods for admin operations
  async findAll(filter: any = {}): Promise<{ blacklists: any[]; total: number }> {
    const { offset, limit, type, keyword } = filter;

    const whereClause = Prisma.sql`
      WHERE (
        B.value::text ILIKE CONCAT('%', ${keyword}::text, '%') 
        OR B.reason::text ILIKE CONCAT('%', ${keyword}::text, '%')
        OR COALESCE(${keyword}, NULL) IS NULL
      )
      AND (B.type::text = ${type}::text OR COALESCE(${type}, NULL) IS NULL)
    `;

    const retrieveBlacklistsQuery = Prisma.sql`
      SELECT 
        B.id,
        B.type,
        B.value,
        B.reason,
        B.created_at as "createdAt",
        B.created_by as "createdBy"
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
      include: {
        createdByUser: true,
      },
    });
  }

  async create(data: { type: BlacklistType; value: string; reason?: string; createdBy?: number }): Promise<any> {
    return prisma.blacklist.create({
      data: {
        type: data.type,
        value: data.value,
        reason: data.reason,
        createdBy: data.createdBy,
      },
    });
  }

  async update(id: number, data: any): Promise<any> {
    return prisma.blacklist.update({
      where: { id },
      data: {
        ...data,
      },
    });
  }

  async delete(id: number): Promise<void> {
    await prisma.blacklist.delete({
      where: { id },
    });
  }

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
} 