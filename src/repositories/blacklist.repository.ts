import { Injectable } from '@nestjs/common';
import { BlacklistType } from '@prisma/client';
import prisma from '../common/prisma';
import { Prisma } from '@prisma/client';
import { FindAllBlacklistsFilter, CreateBlacklistData } from './entities/blacklist.entity';

@Injectable()
export class BlacklistRepository {
  async findAll(filter: FindAllBlacklistsFilter): Promise<{ data: any[]; total: number; offset: number; limit: number }> {
    const { offset, limit } = filter;

    const whereClause = Prisma.sql`
      WHERE (
        B.value::text ILIKE CONCAT('%', ${filter.keyword}::text, '%') 
        OR B.reason::text ILIKE CONCAT('%', ${filter.keyword}::text, '%')
        OR COALESCE(${filter.keyword}, NULL) IS NULL
      )
      AND (B.type::text = ${filter.type}::text OR COALESCE(${filter.type}, NULL) IS NULL)
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
      data: blacklists,
      total: count,
      offset,
      limit,
    };
  }

  async findById(id: number): Promise<any | null> {
    return prisma.blacklist.findUnique({
      where: { id },
      include: {
        CreatedBy: true,
      },
    });
  }

  async create(data: CreateBlacklistData): Promise<any> {
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