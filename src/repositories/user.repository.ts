import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import prisma from '../common/prisma';

export interface CreateUserData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  createdBy?: number;
}

export interface UpdateUserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  updatedBy?: number;
}

export interface UserFilter {
  offset: number;
  limit: number;
  keyword?: string;
  status?: string;
}

@Injectable()
export class UserRepository {
  async create(data: CreateUserData): Promise<any> {
    return await prisma.user.create({
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findById(id: number): Promise<any> {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByEmail(email: string): Promise<any> {
    return await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findWithPagination(filter: UserFilter): Promise<any> {
    const { offset, limit, keyword, status } = filter;

    const whereClause = Prisma.sql`
      WHERE (
        U.email::text ILIKE CONCAT('%', ${keyword}::text, '%') 
        OR U.first_name::text ILIKE CONCAT('%', ${keyword}::text, '%')
        OR U.last_name::text ILIKE CONCAT('%', ${keyword}::text, '%')
        OR COALESCE(${keyword}, NULL) IS NULL
      )
      AND (
        CASE 
          WHEN ${status} = 'active' THEN U.is_active = true
          WHEN ${status} = 'inactive' THEN U.is_active = false
          ELSE TRUE
        END
      )
    `;

    const query = Prisma.sql`
      SELECT 
        U.id,
        U.email,
        U.first_name,
        U.last_name,
        U.is_active,
        U.created_at,
        U.updated_at
      FROM users U 
      ${whereClause} 
      ORDER BY U.created_at DESC 
      LIMIT ${limit} 
      OFFSET ${offset}
    `;

    const countQuery = Prisma.sql`
      SELECT COUNT(*)::int 
      FROM users U 
      ${whereClause}
    `;

    const data: any[] = await prisma.$queryRaw(query);
    const [{ count }]: { count: number }[] = await prisma.$queryRaw(countQuery);

    return {
      data,
      meta: {
        total: count,
        page: Math.floor(offset / limit) + 1,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async update(id: number, updateData: UpdateUserData): Promise<any> {
    return await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  async delete(id: number): Promise<any> {
    return await prisma.user.delete({
      where: { id },
    });
  }
}
