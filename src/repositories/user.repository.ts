import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import prisma from '../common/prisma';
import { FindUsersWithPaginationFilter } from './entities/user.entity';
import { TeamMemberRole } from '../common/enums/generic.enum';

@Injectable()
export class UserRepository {
  async createUserAndPersonalTeam(userData: any, teamData: { name: string; slug: string }): Promise<any> {
    return prisma.$transaction(async (prismaClient: PrismaClient) => {
      const user = await prismaClient.user.create({
        data: userData,
      });

      // Create the default team
      const team = await prismaClient.team.create({
        data: teamData,
      });

      // Add the user as the team owner
      await prismaClient.teamMember.create({
        data: {
          teamId: team.id,
          userId: user.id,
          role: TeamMemberRole.owner,
        },
      });

      return user;
    });
  }

  async findById(id: number): Promise<any | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<any | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: number, data: Partial<any>): Promise<any> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }

  async findWithPagination(filter: FindUsersWithPaginationFilter): Promise<{ data: any[]; total: number; offset: number; limit: number }> {
    const { offset, limit } = filter;

    const whereClause = Prisma.sql`
      WHERE (
        U.email::text ILIKE CONCAT('%', ${filter.keyword}::text, '%') 
        OR U.first_name::text ILIKE CONCAT('%', ${filter.keyword}::text, '%')
        OR U.last_name::text ILIKE CONCAT('%', ${filter.keyword}::text, '%')
        OR COALESCE(${filter.keyword}, NULL) IS NULL
      )
      AND (
        CASE 
          WHEN ${filter.status} = 'active' THEN U.status = 'ACTIVE'
          WHEN ${filter.status} = 'inactive' THEN U.status = 'SUSPENDED'
          WHEN ${filter.status} = 'pending' THEN U.status = 'PENDING'
          WHEN ${filter.status} = 'suspended' THEN U.status = 'SUSPENDED'
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
        U.status,
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
      total: count,
      offset,
      limit,
    };
  }

}
