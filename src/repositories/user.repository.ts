import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import prisma from '../common/prisma';
import { generateSlug } from '../utils/string.util';

@Injectable()
export class UserRepository {
  async createUserAndPersonalTeam(data: any): Promise<any> {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data,
      });

      const emailPrefix = data.email.split('@')[0];
      const teamName = `${emailPrefix}'s Team`;
      const baseSlug = generateSlug(teamName);
      
      // Generate unique slug
      let slug = baseSlug;
      let counter = 1;
      while (await tx.team.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Create the default team (removed description, isDefault, isPublic, createdBy)
      const team = await tx.team.create({
        data: {
          name: teamName,
          slug,
        },
      });

      // Add the user as the team owner (removed status, joinedAt)
      await tx.teamMember.create({
        data: {
          teamId: team.id,
          userId: user.id,
          role: 'owner',
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

  async findByOAuth(oauthProvider: string, oauthId: string): Promise<any | null> {
    const oauthAccount = await prisma.oAuthAccount.findFirst({
      where: {
        provider: oauthProvider as any,
        providerUserId: oauthId,
      },
      include: {
        user: true,
      },
    });
    
    return oauthAccount?.user || null;
  }

  async update(id: number, updateData: any): Promise<any> {
    return prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async updateUser(id: number, data:any): Promise<any> {
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

  async getUserCount(): Promise<number> {
    return await prisma.user.count();
  }

  async getActiveUserCount(): Promise<number> {
    return await prisma.user.count({
      where: { status: 'ACTIVE' },
    });
  }

  async getPendingUserCount(): Promise<number> {
    return 0;
  }

  async getSuspendedUserCount(): Promise<number> {
    return await prisma.user.count({
      where: { status: 'SUSPENDED' },
    });
  }

  async getTotalUserCount(): Promise<number> {
    return await prisma.user.count();
  }

  async findWithPagination(filter: { offset: number; limit: number; keyword?: string; status?: string }): Promise<any> {
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
          WHEN ${status} = 'active' THEN U.status = 'ACTIVE'
          WHEN ${status} = 'inactive' THEN U.status = 'SUSPENDED'
          WHEN ${status} = 'pending' THEN U.status = 'PENDING'
          WHEN ${status} = 'suspended' THEN U.status = 'SUSPENDED'
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
      meta: {
        total: count,
        page: Math.floor(offset / limit) + 1,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async findUserByOAuthId(provider: string, oauthId: string): Promise<any> {
    const oauthAccount = await prisma.oAuthAccount.findFirst({
      where: {
        provider: provider as any,
        providerUserId: oauthId,
      },
      include: {
        user: true,
      },
    });
    
    return oauthAccount?.user || null;
  }

  async linkOAuthAccount(userId: number, provider: string, oauthId: string, accessToken?: string): Promise<any> {
    return prisma.oAuthAccount.create({
      data: {
        userId,
        provider: provider as any,
        providerUserId: oauthId,
        accessToken,
      },
    });
  }

  async createOAuthUser(data: {
    email: string;
    firstName?: string;
    lastName?: string;
    isEmailVerified: boolean;
    oauthProvider: string;
    oauthId: string;
    accessToken?: string;
  }): Promise<any> {
    return prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          emailVerifiedAt: data.isEmailVerified ? new Date() : null,
          status: 'ACTIVE',
        },
      });

      // Create OAuth account link
      await tx.oAuthAccount.create({
        data: {
          userId: user.id,
          provider: data.oauthProvider as any,
          providerUserId: data.oauthId,
          accessToken: data.accessToken,
        },
      });

      return user;
    });
  }
}
