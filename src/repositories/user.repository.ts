import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import prisma from '../common/prisma';
import { FindUsersWithPaginationFilter } from './entities/user.entity';
import { TeamMemberRole } from '../common/enums/generic.enum';

@Injectable()
export class UserRepository {
  async createLocalAuthUserAndPersonalTeam(userData: any): Promise<any> {
    return prisma.$transaction(async (prismaClient) => {
      // Extract team data and verification data from userData (passed by service)
      const { teamName, teamSlug, password, emailVerificationToken, emailVerificationExpiresAt, ...userFields } = userData;

      const user = await prismaClient.user.create({
        data: {
          email: userFields.email,
          name: userFields.name,
          firstName: userFields.firstName,
          lastName: userFields.lastName,
          photoUrl: userFields.photoUrl,
          timezone: userFields.timezone || 'UTC',
          language: userFields.language || 'en',
          status: userFields.status || 'ACTIVE',
          type: userFields.type || 'CUSTOMER',
          emailVerifiedAt: userFields.emailVerifiedAt,
          totpEnabled: userFields.totpEnabled || false,
          totpSecret: userFields.totpSecret,
          localAuthAccount: {
            create: {
              passwordHash: password, // Already hashed by service
            },
          },
          teamMemberships: {
            create: {
              role: TeamMemberRole.owner,
              Team: {
                create: {
                  name: teamName,
                  slug: teamSlug,
                },
              },
            },
          },
          verificationRequests: {
            create: {
              email: userFields.email,
              token: emailVerificationToken,
              type: 'EMAIL_VERIFICATION',
              expiresAt: emailVerificationExpiresAt,
            },
          },
        },
      });

      return user;
    });
  }

  async createOAuthUserAndPersonalTeam(userData: any): Promise<any> {
    return prisma.$transaction(async (prismaClient) => {
      // Extract team data from userData (passed by service)
      const { teamName, teamSlug, ...userFields } = userData;

      const user = await prismaClient.user.create({
        data: {
          email: userFields.email,
          name: userFields.name,
          firstName: userFields.firstName,
          lastName: userFields.lastName,
          photoUrl: userFields.photoUrl,
          timezone: userFields.timezone || 'UTC',
          language: userFields.language || 'en',
          status: userFields.status || 'ACTIVE',
          type: userFields.type || 'CUSTOMER',
          emailVerifiedAt: userFields.emailVerifiedAt,
          totpEnabled: userFields.totpEnabled || false,
          totpSecret: userFields.totpSecret,
          teamMemberships: {
            create: {
              role: TeamMemberRole.owner,
              Team: {
                create: {
                  name: teamName,
                  slug: teamSlug,
                },
              },
            },
          },
        },
      });

      return user;
    });
  }

  async findById(id: number): Promise<any | null> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        localAuthAccount: true,
      },
    });
  }

  async findByEmail(email: string): Promise<any | null> {
    return prisma.user.findUnique({
      where: { email },
      include: {
        localAuthAccount: true,
      },
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
