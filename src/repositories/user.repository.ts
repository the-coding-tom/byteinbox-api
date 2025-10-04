import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import prisma from '../common/prisma';
import { generateSlug } from '../utils/string.util';

@Injectable()
export class UserRepository {
  // Basic CRUD operations
  async create(data: any): Promise<any> {
    return prisma.user.create({
      data,
    });
  }

  /**
   * Create user and default team in a single transaction
   */
  async createWithDefaultTeam(data: {
    userData: any;
    userEmail: string;
  }): Promise<{ user: any; team: any }> {
    return prisma.$transaction(async (tx) => {
      // Create the user
      const user = await tx.user.create({
        data: data.userData,
      });

      // Generate team name and slug
      const emailPrefix = data.userEmail.split('@')[0];
      const teamName = `${emailPrefix}'s Team`;
      const baseSlug = generateSlug(teamName);
      
      // Generate unique slug
      let slug = baseSlug;
      let counter = 1;
      while (await tx.team.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Create the default team
      const team = await tx.team.create({
        data: {
          name: teamName,
          description: 'Your default team for managing API keys and resources',
          slug,
          isDefault: true,
          isPublic: false,
          createdBy: user.id,
        },
      });

      // Add the user as the team owner
      await tx.teamMember.create({
        data: {
          teamId: team.id,
          userId: user.id,
          role: 'OWNER',
          status: 'ACTIVE',
          joinedAt: new Date(),
        },
      });

      return { user, team };
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
    return prisma.user.findFirst({
      where: {
        oauthProvider,
        oauthId,
      },
    });
  }

  async findByPhoneNumber(phoneNumber: string): Promise<any | null> {
    return prisma.user.findFirst({
      where: { phoneNumber },
    });
  }

  async update(id: number, updateData: any): Promise<any> {
    return prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async updateUser(userData: any): Promise<any> {
    const { id, ...updateData } = userData;
    return prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: number): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }

  // Email verification methods
  async findByEmailVerificationToken(token: string): Promise<any | null> {
    return prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  // Password reset methods
  async findByPasswordResetToken(token: string): Promise<any | null> {
    return prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  // User statistics
  async getUserCount(): Promise<number> {
    return await prisma.user.count();
  }

  async getActiveUserCount(): Promise<number> {
    return await prisma.user.count({
      where: { status: 'ACTIVE' },
    });
  }

  async getPendingUserCount(): Promise<number> {
    return await prisma.user.count({
      where: { status: 'PENDING' },
    });
  }

  async getSuspendedUserCount(): Promise<number> {
    return await prisma.user.count({
      where: { status: 'SUSPENDED' },
    });
  }

  async getTotalUserCount(): Promise<number> {
    return await prisma.user.count();
  }

  // Pagination and filtering
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
}
